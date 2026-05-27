import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { AppError, NotFoundError } from '@/shared/api/errors';
import { assertBusinessUser } from '@/shared/auth/guards';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import { canTransitionEventLifecycle, getAllowedEventTransitions } from '@/shared/state/lifecycles';
import type { EventStatus } from '@/shared/state/enums/event-status';
import {
  assertEventCompanyAccess,
  assertEventRecordAccess,
  evaluateEventStaffingReadiness,
} from '@/modules/events/hooks';
import { EventRepository } from '@/modules/events/repositories';
import type {
  CreateEventInput,
  TransitionEventStatusInput,
  UpdateEventInput,
} from '@/modules/events/schemas';
import type { EventDto, EventListItemDto } from '@/modules/events/types';
import type { EventStaffingReadiness } from '@/modules/events/types/event-workflow';
import { publishStaffingDomainEvent } from './domain-event-publisher';

export class EventService extends AuthenticatedBaseService {
  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getRepository() {
    return new EventRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private async resolveOwner(companyProfileId: string) {
    const company = await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformIdentity(),
      companyProfileId,
    );
    return company.owner_business_user_id;
  }

  private async toDto(event: Awaited<ReturnType<EventRepository['findById']>> & object): Promise<EventDto> {
    const repo = this.getRepository();
    const jobCounts = await repo.countJobsByEvent(event.id);
    const staffing = evaluateEventStaffingReadiness(event, jobCounts);

    return {
      ...event,
      staffing,
      lifecycle: {
        status: event.status,
        allowedTransitions: getAllowedEventTransitions(event.status),
      },
    };
  }

  async listEvents(companyProfileId: string, status?: EventStatus): Promise<EventListItemDto[]> {
    await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformIdentity(),
      companyProfileId,
    );

    const repo = this.getRepository();
    const events = await repo.listByCompany(companyProfileId, status);

    return Promise.all(
      events.map(async (event) => {
        const counts = await repo.countJobsByEvent(event.id);
        return {
          id: event.id,
          company_profile_id: event.company_profile_id,
          title: event.title,
          status: event.status,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          city: event.city,
          published_at: event.published_at,
          updated_at: event.updated_at,
          openJobCount: counts.open,
        };
      }),
    );
  }

  async getEvent(eventId: string): Promise<EventDto> {
    const repo = this.getRepository();
    const event = await repo.findById(eventId);

    if (!event) {
      throw new NotFoundError('Event not found.');
    }

    const ownerId = await this.resolveOwner(event.company_profile_id);
    assertEventRecordAccess(this.requirePlatformIdentity(), event, ownerId);

    return this.toDto(event);
  }

  async createEvent(input: CreateEventInput): Promise<EventDto> {
    const { identity } = this.requirePlatformSession();
    const businessUser = assertBusinessUser(identity);
    await assertEventCompanyAccess(this.context.supabase, identity, input.companyProfileId);

    const event = await this.getRepository().create(businessUser.id, input);

    publishStaffingDomainEvent(
      'events.event_created',
      event.id,
      { companyProfileId: event.company_profile_id, status: event.status },
      this.context.requestId,
    );

    return this.toDto(event);
  }

  async updateEvent(eventId: string, input: UpdateEventInput): Promise<EventDto> {
    const repo = this.getRepository();
    const existing = await repo.findById(eventId);

    if (!existing) {
      throw new NotFoundError('Event not found.');
    }

    const ownerId = await this.resolveOwner(existing.company_profile_id);
    assertEventRecordAccess(this.requirePlatformIdentity(), existing, ownerId);

    const event = await repo.update(eventId, input);

    publishStaffingDomainEvent(
      'events.event_updated',
      event.id,
      { status: event.status },
      this.context.requestId,
    );

    return this.toDto(event);
  }

  async transitionEventStatus(
    eventId: string,
    input: TransitionEventStatusInput,
  ): Promise<EventDto> {
    const repo = this.getRepository();
    const existing = await repo.findById(eventId);

    if (!existing) {
      throw new NotFoundError('Event not found.');
    }

    const ownerId = await this.resolveOwner(existing.company_profile_id);
    assertEventRecordAccess(this.requirePlatformIdentity(), existing, ownerId);

    if (!canTransitionEventLifecycle(existing.status, input.toStatus)) {
      throw new AppError(
        'INVALID_TRANSITION',
        `Cannot transition event from ${existing.status} to ${input.toStatus}.`,
        422,
      );
    }

    if (input.toStatus === 'open') {
      const readiness = evaluateEventStaffingReadiness(
        existing,
        await repo.countJobsByEvent(eventId),
      );
      if (!readiness.publishReady) {
        throw new AppError(
          'EVENT_NOT_READY',
          'Event does not meet publish requirements.',
          422,
          readiness,
        );
      }
    }

    const event = await repo.transitionStatus(eventId, input.toStatus);

    if (input.toStatus === 'open') {
      publishStaffingDomainEvent(
        'events.event_opened',
        event.id,
        { companyProfileId: event.company_profile_id, idempotencyKey: input.idempotencyKey },
        this.context.requestId,
      );
    } else {
      publishStaffingDomainEvent(
        'events.event_status_changed',
        event.id,
        { fromStatus: existing.status, toStatus: input.toStatus, idempotencyKey: input.idempotencyKey },
        this.context.requestId,
      );
    }

    return this.toDto(event);
  }

  async getEventReadiness(eventId: string): Promise<EventStaffingReadiness> {
    const dto = await this.getEvent(eventId);
    return dto.staffing;
  }
}
