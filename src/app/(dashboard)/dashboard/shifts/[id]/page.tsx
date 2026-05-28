'use client';

import { useParams } from 'next/navigation';
import { ShiftDetailFoundation } from '@/modules/shifts/components';
import { useShiftDetail } from '@/modules/shifts/hooks';
import { AsyncBoundary } from '@/shared/components/operational';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';

export default function ShiftDetailShellPage() {
  const params = useParams<{ id: string }>();
  const shiftId = params.id;
  const shift = useShiftDetail(shiftId);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Shift detail</h2>
        <p className="text-sm text-muted-foreground">
          Crew and business execution controls with realtime-safe workflow state.
        </p>
      </div>
      <AsyncBoundary
        isLoading={shift.isLoading}
        error={shift.error}
        onRetry={shift.reload}
        loadingFallback={<FormSectionSkeleton rows={8} />}
      >
        <ShiftDetailFoundation shift={shift.data} onShiftUpdated={shift.reload} />
      </AsyncBoundary>
    </section>
  );
}
