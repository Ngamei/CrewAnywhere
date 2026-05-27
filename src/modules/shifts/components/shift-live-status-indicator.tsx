'use client';

import { StateIndicator } from '@/shared/components/operational';
import { cn } from '@/shared/lib/cn';
import { useShiftActivitySubscription, type ShiftRealtimeConnectionState } from '@/modules/shifts/hooks';

type ShiftLiveStatusIndicatorProps = {
  shiftId?: string;
  assignmentId?: string;
  className?: string;
};

function mapConnectionToIndicator(connectionState: ShiftRealtimeConnectionState) {
  switch (connectionState) {
    case 'live':
      return { variant: 'live' as const, label: 'Live — workflow.shifts' };
    case 'connecting':
      return { variant: 'syncing' as const, label: 'Connecting to workflow.shifts' };
    case 'offline':
      return { variant: 'offline' as const, label: 'Realtime offline' };
    default:
      return { variant: 'idle' as const, label: 'Realtime idle' };
  }
}

export function ShiftLiveStatusIndicator({ shiftId, assignmentId, className }: ShiftLiveStatusIndicatorProps) {
  const { connectionState, lastActivityAt } = useShiftActivitySubscription({ shiftId, assignmentId });

  const indicator = mapConnectionToIndicator(connectionState);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2', className)}>
      <StateIndicator variant={indicator.variant} label={indicator.label} />
      {lastActivityAt ? (
        <p className="text-xs text-muted-foreground">
          Last activity {new Date(lastActivityAt).toLocaleTimeString()}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Waiting for workflow transitions</p>
      )}
    </div>
  );
}
