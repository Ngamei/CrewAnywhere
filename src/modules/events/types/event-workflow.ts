import type { EventStatus } from '@/shared/state/enums/event-status';

export type EventOperationalMetadata = {
  venueConfigured: boolean;
  scheduleConfigured: boolean;
  locationConfigured: boolean;
  openJobCount: number;
  staffedJobCount: number;
};

export type EventStaffingReadiness = {
  staffingReady: boolean;
  operationalReady: boolean;
  publishReady: boolean;
  metadata: EventOperationalMetadata;
};

export type EventLifecycleContext = {
  status: EventStatus;
  allowedTransitions: readonly EventStatus[];
};
