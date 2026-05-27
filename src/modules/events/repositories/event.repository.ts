import { BaseRepository } from '@/backend/repositories/base-repository';
import type { DomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { EventStatus } from '@/shared/state/enums/event-status';
import type { EventRecord } from '@/modules/events/types/event-records';
import type { CreateEventInput, UpdateEventInput } from '@/modules/events/schemas';

const EVENT_COLUMNS =
  'id, company_profile_id, created_by_business_user_id, title, description, venue_name, address_line, city, country_code, starts_at, ends_at, status, published_at, created_at, updated_at, deleted_at';

export class EventRepository extends BaseRepository {
  constructor(private readonly clients: DomainRepositoryClients) {
    super(clients.read);
  }

  async findById(id: string): Promise<EventRecord | null> {
    const { data, error } = await this.clients.read
      .from('events')
      .select(EVENT_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as EventRecord | null;
  }

  async listByCompany(companyProfileId: string, status?: EventStatus): Promise<EventRecord[]> {
    let query = this.clients.read
      .from('events')
      .select(EVENT_COLUMNS)
      .eq('company_profile_id', companyProfileId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as EventRecord[];
  }

  async countJobsByEvent(eventId: string): Promise<{ total: number; open: number; staffed: number }> {
    const { data, error } = await this.clients.read
      .from('jobs')
      .select('id, status')
      .eq('event_id', eventId)
      .is('deleted_at', null);

    if (error) throw error;

    const rows = data ?? [];
    const open = rows.filter((j) => j.status === 'open' || j.status === 'reviewing').length;
    const staffed = rows.filter((j) =>
      ['filled', 'active', 'completed'].includes(j.status as string),
    ).length;

    return { total: rows.length, open, staffed };
  }

  async create(
    businessUserId: string,
    input: CreateEventInput,
  ): Promise<EventRecord> {
    const { data, error } = await this.clients.write
      .from('events')
      .insert({
        company_profile_id: input.companyProfileId,
        created_by_business_user_id: businessUserId,
        title: input.title,
        description: input.description ?? null,
        venue_name: input.venueName ?? null,
        address_line: input.addressLine ?? null,
        city: input.city ?? null,
        country_code: input.countryCode ?? null,
        starts_at: input.startsAt ?? null,
        ends_at: input.endsAt ?? null,
        status: 'draft',
      })
      .select(EVENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as EventRecord;
  }

  async update(eventId: string, input: UpdateEventInput): Promise<EventRecord> {
    const patch: Record<string, unknown> = {};

    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.venueName !== undefined) patch.venue_name = input.venueName;
    if (input.addressLine !== undefined) patch.address_line = input.addressLine;
    if (input.city !== undefined) patch.city = input.city;
    if (input.countryCode !== undefined) patch.country_code = input.countryCode;
    if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
    if (input.endsAt !== undefined) patch.ends_at = input.endsAt;

    const { data, error } = await this.clients.write
      .from('events')
      .update(patch)
      .eq('id', eventId)
      .is('deleted_at', null)
      .select(EVENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as EventRecord;
  }

  async transitionStatus(eventId: string, toStatus: EventStatus): Promise<EventRecord> {
    const patch: Record<string, unknown> = { status: toStatus };

    if (toStatus === 'open') {
      patch.published_at = new Date().toISOString();
    }

    const { data, error } = await this.clients.write
      .from('events')
      .update(patch)
      .eq('id', eventId)
      .is('deleted_at', null)
      .select(EVENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as EventRecord;
  }
}
