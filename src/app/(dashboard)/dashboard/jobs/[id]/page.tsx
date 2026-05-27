import { JobFormFoundation, JobReadinessIndicator } from '@/modules/jobs/components';
import type { JobPublishingReadiness } from '@/modules/jobs/types/job-workflow';

const placeholderReadiness: JobPublishingReadiness = {
  publishReady: false,
  operationalReady: false,
  compensation: {
    rateAmount: null,
    rateCurrency: 'USD',
    headcount: 1,
    hasCompensation: false,
  },
  schedule: {
    eventStartsAt: null,
    eventEndsAt: null,
    scheduleConfigured: false,
  },
  staffing: {
    headcount: 1,
    requiredSkillCount: 0,
    skills: [],
  },
};

export default function JobDetailShellPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Job detail</h2>
        <p className="text-sm text-muted-foreground">
          Readiness from <code className="text-xs">GET /api/v1/jobs/:id/readiness</code>
        </p>
      </div>
      <JobReadinessIndicator readiness={placeholderReadiness} />
      <JobFormFoundation />
    </section>
  );
}
