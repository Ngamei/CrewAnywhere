'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Route } from 'next';
import { Clock3, TriangleAlert } from 'lucide-react';
import { WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
import { ShiftsEmptyState } from '@/modules/onboarding';
import { useShiftActivitySubscription } from '@/modules/shifts/hooks';
import type { ShiftListItemDto } from '@/modules/shifts/types';

const columns: OperationalTableColumn<ShiftListItemDto>[] = [
  {
    id: 'window',
    header: 'Shift window',
    cell: (row) => (
      <span className="font-medium">
        {new Date(row.starts_at).toLocaleString()} – {new Date(row.ends_at).toLocaleTimeString()}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <WorkflowStatusBadge status={row.status} />,
  },
  {
    id: 'crew',
    header: 'Crew',
    hideOnMobile: true,
    cell: (row) => <span className="font-mono text-xs">{row.crew_user_id.slice(0, 8)}…</span>,
  },
  {
    id: 'assignment',
    header: 'Assignment',
    hideOnMobile: true,
    cell: (row) => <span className="font-mono text-xs">{row.assignment_id.slice(0, 8)}…</span>,
  },
  {
    id: 'attendance',
    header: 'Attendance',
    hideOnMobile: true,
    cell: (row) => (row.check_in_at ? 'Checked in' : 'Pending'),
  },
];

type ShiftsTableFoundationProps = {
  data?: ShiftListItemDto[];
  isLoading?: boolean;
  assignmentId?: string;
  showCrewContext?: boolean;
};

export function ShiftsTableFoundation({
  data = [],
  isLoading,
  assignmentId,
  showCrewContext = false,
}: ShiftsTableFoundationProps) {
  const router = useRouter();
  useShiftActivitySubscription({ assignmentId });

  const [now] = useState(() => Date.now());
  const activeAlerts = data.filter(
    (shift) =>
      shift.status === 'scheduled' &&
      !shift.check_in_at &&
      new Date(shift.starts_at).getTime() < now + 15 * 60_000,
  );

  return (
    <div className="space-y-4">
      {activeAlerts.length > 0 ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert className="size-4" aria-hidden />
            {activeAlerts.length} shift{activeAlerts.length > 1 ? 's' : ''} starting soon without check-in
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 md:hidden">
        {data.length === 0 && !isLoading ? <ShiftsEmptyState /> : null}
        {data.map((shift) => (
          <button
            key={shift.id}
            type="button"
            onClick={() => router.push(`/dashboard/shifts/${shift.id}` as Route)}
            className="space-y-3 rounded-lg border bg-card p-4 text-left shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {new Date(shift.starts_at).toLocaleDateString()} · {new Date(shift.starts_at).toLocaleTimeString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ends {new Date(shift.ends_at).toLocaleTimeString()}
                </p>
              </div>
              <WorkflowStatusBadge status={shift.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" aria-hidden />
              {shift.check_in_at
                ? `Checked in ${new Date(shift.check_in_at).toLocaleTimeString()}`
                : 'Awaiting check-in'}
            </div>
            {showCrewContext ? null : (
              <p className="font-mono text-[11px] text-muted-foreground">Crew {shift.crew_user_id.slice(0, 8)}…</p>
            )}
          </button>
        ))}
      </div>

      <div className="hidden md:block">
        <OperationalTable
          caption="Operational shifts"
          columns={columns}
          data={data}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyState={<ShiftsEmptyState />}
          emptyMessage="No shifts scheduled for this scope."
          onRowClick={(row) => router.push(`/dashboard/shifts/${row.id}` as Route)}
        />
      </div>
    </div>
  );
}
