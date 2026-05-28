'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
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
};

export function ShiftsTableFoundation({
  data = [],
  isLoading,
  assignmentId,
}: ShiftsTableFoundationProps) {
  const router = useRouter();
  useShiftActivitySubscription({ assignmentId });

  return (
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
  );
}
