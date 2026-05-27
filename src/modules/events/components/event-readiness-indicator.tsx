import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import type { EventStaffingReadiness } from '@/modules/events/types/event-workflow';

type EventReadinessIndicatorProps = {
  readiness: EventStaffingReadiness;
};

export function EventReadinessIndicator({ readiness }: EventReadinessIndicatorProps) {
  const { metadata } = readiness;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Staffing readiness</CardTitle>
            <CardDescription>Operational gates before publishing the event.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {readiness.publishReady && <Badge variant="secondary">Publish ready</Badge>}
            {readiness.staffingReady && <Badge variant="secondary">Staffing ready</Badge>}
            {readiness.operationalReady && <Badge>Operational</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between rounded-md border px-3 py-2">
            <dt>Venue</dt>
            <dd>{metadata.venueConfigured ? 'Yes' : 'No'}</dd>
          </div>
          <div className="flex justify-between rounded-md border px-3 py-2">
            <dt>Schedule</dt>
            <dd>{metadata.scheduleConfigured ? 'Yes' : 'No'}</dd>
          </div>
          <div className="flex justify-between rounded-md border px-3 py-2">
            <dt>Location</dt>
            <dd>{metadata.locationConfigured ? 'Yes' : 'No'}</dd>
          </div>
          <div className="flex justify-between rounded-md border px-3 py-2">
            <dt>Open jobs</dt>
            <dd>{metadata.openJobCount}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
