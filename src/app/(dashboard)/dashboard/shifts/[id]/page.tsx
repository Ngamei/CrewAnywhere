import { ShiftDetailFoundation } from '@/modules/shifts/components';

type ShiftDetailShellPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShiftDetailShellPage({ params }: ShiftDetailShellPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Shift detail</h2>
        <p className="text-sm text-muted-foreground">
          Operational shell for shift <span className="font-mono text-xs">{id}</span> — timeline via{' '}
          <code className="text-xs">GET /api/v1/shifts/:id/timeline</code> (API shell pending).
        </p>
      </div>
      <ShiftDetailFoundation />
    </section>
  );
}
