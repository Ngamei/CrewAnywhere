import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { EventService } from '@/modules/events/services';
import type {
  CreateEventInput,
  TransitionEventStatusInput,
  UpdateEventInput,
} from '@/modules/events/schemas';
import type { EventStatus } from '@/shared/state/enums/event-status';

export async function listCompanyEvents(
  context: AuthenticatedServiceContext,
  companyProfileId: string,
  status?: EventStatus,
) {
  return new EventService(context).listEvents(companyProfileId, status);
}

export async function getEvent(context: AuthenticatedServiceContext, eventId: string) {
  return new EventService(context).getEvent(eventId);
}

export async function createEvent(context: AuthenticatedServiceContext, input: CreateEventInput) {
  return new EventService(context).createEvent(input);
}

export async function updateEvent(
  context: AuthenticatedServiceContext,
  eventId: string,
  input: UpdateEventInput,
) {
  return new EventService(context).updateEvent(eventId, input);
}

export async function transitionEventStatus(
  context: AuthenticatedServiceContext,
  eventId: string,
  input: TransitionEventStatusInput,
) {
  return new EventService(context).transitionEventStatus(eventId, input);
}

export async function getEventReadiness(context: AuthenticatedServiceContext, eventId: string) {
  return new EventService(context).getEventReadiness(eventId);
}
