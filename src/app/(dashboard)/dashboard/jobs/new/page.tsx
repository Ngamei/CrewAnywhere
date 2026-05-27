import { JobFormFoundation } from '@/modules/jobs/components';

export default function NewJobShellPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Create job</h2>
        <p className="text-sm text-muted-foreground">Form foundation — connect to POST /api/v1/jobs.</p>
      </div>
      <JobFormFoundation />
    </section>
  );
}
