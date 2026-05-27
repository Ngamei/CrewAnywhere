import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import type { JobPublishingReadiness } from '@/modules/jobs/types/job-workflow';

type JobReadinessIndicatorProps = {
  readiness: JobPublishingReadiness;
};

export function JobReadinessIndicator({ readiness }: JobReadinessIndicatorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Publishing readiness</CardTitle>
            <CardDescription>Compensation, schedule, and staffing requirements.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {readiness.publishReady && <Badge variant="secondary">Publish ready</Badge>}
            {readiness.operationalReady && <Badge>Operational</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between rounded-md border px-3 py-2">
            <dt>Compensation</dt>
            <dd>{readiness.compensation.hasCompensation ? 'Set' : 'Missing'}</dd>
          </div>
          <div className="flex justify-between rounded-md border px-3 py-2">
            <dt>Schedule</dt>
            <dd>{readiness.schedule.scheduleConfigured ? 'Set' : 'Missing'}</dd>
          </div>
          <div className="flex justify-between rounded-md border px-3 py-2">
            <dt>Headcount</dt>
            <dd>{readiness.staffing.headcount}</dd>
          </div>
          <div className="flex justify-between rounded-md border px-3 py-2">
            <dt>Required skills</dt>
            <dd>{readiness.staffing.requiredSkillCount}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
