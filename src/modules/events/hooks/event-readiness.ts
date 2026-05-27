import type { EventRecord } from '@/modules/events/types/event-records';
import type { EventOperationalMetadata, EventStaffingReadiness } from '@/modules/events/types/event-workflow';

type JobCountSnapshot = {
  total: number;
  open: number;
  staffed: number;
};

export function buildEventOperationalMetadata(
  event: EventRecord,
  jobs: JobCountSnapshot,
): EventOperationalMetadata {
  return {
    venueConfigured: Boolean(event.venue_name?.trim()),
    scheduleConfigured: Boolean(event.starts_at && event.ends_at),
    locationConfigured: Boolean(event.city?.trim() && event.country_code),
    openJobCount: jobs.open,
    staffedJobCount: jobs.staffed,
  };
}

export function evaluateEventStaffingReadiness(
  event: EventRecord,
  jobs: JobCountSnapshot,
): EventStaffingReadiness {
  const metadata = buildEventOperationalMetadata(event, jobs);

  const publishReady =
    Boolean(event.title?.trim()) &&
    metadata.scheduleConfigured &&
    metadata.locationConfigured;

  const staffingReady = publishReady && jobs.total > 0 && jobs.open > 0;
  const operationalReady =
    event.status === 'open' && staffingReady && metadata.venueConfigured;

  return {
    staffingReady,
    operationalReady,
    publishReady,
    metadata,
  };
}
