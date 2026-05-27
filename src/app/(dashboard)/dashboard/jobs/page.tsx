import Link from 'next/link';
import type { Route } from 'next';
import { JobsTableFoundation } from '@/modules/jobs/components';
import { Button } from '@/shared/ui/button';

export default function JobsShellPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Staffing roles — scoped to events via{' '}
            <code className="text-xs">GET /api/v1/events/:id/jobs</code>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={'/dashboard/jobs/new' as Route}>New job</Link>
        </Button>
      </div>
      <JobsTableFoundation />
    </section>
  );
}
