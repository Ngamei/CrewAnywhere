import Link from 'next/link';
import type { Route } from 'next';
import { EventsTableFoundation } from '@/modules/events/components';
import { Button } from '@/shared/ui/button';

export default function EventsShellPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Events</h2>
          <p className="text-sm text-muted-foreground">
            Staffing events for your company — list via{' '}
            <code className="text-xs">GET /api/v1/events?companyProfileId=…</code>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={'/dashboard/events/new' as Route}>New event</Link>
        </Button>
      </div>
      <EventsTableFoundation />
    </section>
  );
}
