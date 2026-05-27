import { EventFormFoundation, EventReadinessIndicator } from '@/modules/events/components';
import { JobsTableFoundation } from '@/modules/jobs/components';
import type { EventStaffingReadiness } from '@/modules/events/types/event-workflow';

const placeholderReadiness: EventStaffingReadiness = {
  staffingReady: false,
  operationalReady: false,
  publishReady: false,
  metadata: {
    venueConfigured: false,
    scheduleConfigured: false,
    locationConfigured: false,
    openJobCount: 0,
    staffedJobCount: 0,
  },
};

export default function EventDetailShellPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Event detail</h2>
        <p className="text-sm text-muted-foreground">
          Readiness from <code className="text-xs">GET /api/v1/events/:id/readiness</code>
        </p>
      </div>
      <EventReadinessIndicator readiness={placeholderReadiness} />
      <EventFormFoundation />
      <div>
        <h3 className="mb-3 text-lg font-medium">Jobs</h3>
        <JobsTableFoundation />
      </div>
    </section>
  );
}
