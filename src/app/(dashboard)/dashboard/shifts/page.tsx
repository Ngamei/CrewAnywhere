import { ShiftLiveStatusIndicator, ShiftsTableFoundation } from '@/modules/shifts/components';

export default function ShiftsShellPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Shifts</h2>
          <p className="text-sm text-muted-foreground">
            Workforce attendance and lifecycle — list via{' '}
            <code className="text-xs">GET /api/v1/shifts</code> (API shell pending).
          </p>
        </div>
        <ShiftLiveStatusIndicator />
      </div>
      <ShiftsTableFoundation />
    </section>
  );
}
