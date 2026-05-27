import { ActivityFeed } from '@/shared/components/operational/activity-feed';
import { StateIndicator } from '@/shared/components/operational/state-indicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const placeholderActivity = [
  {
    id: '1',
    title: 'Design system foundation loaded',
    description: 'Shared UI primitives and operational shell are ready for domain modules.',
    timestamp: new Date().toISOString(),
  },
];

export default function DashboardFoundationPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Operations</p>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard foundation</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Scalable shared UI infrastructure for workflow-heavy marketplace operations. Domain screens plug in
          later under this shell.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Realtime layout</CardTitle>
            <CardDescription>Shell supports live feeds, queues, and transition-heavy views.</CardDescription>
          </CardHeader>
          <CardContent>
            <StateIndicator variant="live" />
          </CardContent>
        </Card>
        <Card className="md:col-span-2 xl:col-span-2">
          <CardHeader>
            <CardTitle>Activity feed</CardTitle>
            <CardDescription>Composable feed primitive for operational event streams.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={placeholderActivity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
