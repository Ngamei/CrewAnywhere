'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
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

const placeholderRows: ShiftListItemDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000050',
    assignment_id: '00000000-0000-0000-0000-000000000041',
    event_id: '00000000-0000-0000-0000-000000000001',
    job_id: '00000000-0000-0000-0000-000000000010',
    crew_user_id: '00000000-0000-0000-0000-000000000040',
    status: 'scheduled',
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    check_in_at: null,
    check_out_at: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000051',
    assignment_id: '00000000-0000-0000-0000-000000000042',
    event_id: '00000000-0000-0000-0000-000000000001',
    job_id: '00000000-0000-0000-0000-000000000010',
    crew_user_id: '00000000-0000-0000-0000-000000000041',
    status: 'checked_in',
    starts_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    check_in_at: new Date().toISOString(),
    check_out_at: null,
    updated_at: new Date().toISOString(),
  },
];

type ShiftsTableFoundationProps = {
  data?: ShiftListItemDto[];
  isLoading?: boolean;
  assignmentId?: string;
};

export function ShiftsTableFoundation({
  data = placeholderRows,
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
      emptyMessage="No shifts scheduled for this scope."
      onRowClick={(row) => router.push(`/dashboard/shifts/${row.id}` as Route)}
    />
  );
}
