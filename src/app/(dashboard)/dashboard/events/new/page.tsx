import { EventFormFoundation } from '@/modules/events/components';

export default function NewEventShellPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Create event</h2>
        <p className="text-sm text-muted-foreground">Form foundation — connect to POST /api/v1/events.</p>
      </div>
      <EventFormFoundation />
    </section>
  );
}
