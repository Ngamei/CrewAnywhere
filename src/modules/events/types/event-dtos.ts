import type { EventRecord } from './event-records';
import type { EventLifecycleContext, EventStaffingReadiness } from './event-workflow';

export type EventDto = EventRecord & {
  staffing: EventStaffingReadiness;
  lifecycle: EventLifecycleContext;
};

export type EventListItemDto = Pick<
  EventRecord,
  | 'id'
  | 'company_profile_id'
  | 'title'
  | 'status'
  | 'starts_at'
  | 'ends_at'
  | 'city'
  | 'published_at'
  | 'updated_at'
> & {
  openJobCount: number;
};
