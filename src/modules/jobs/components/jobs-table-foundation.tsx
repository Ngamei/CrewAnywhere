'use client';

import { JobsEmptyState } from '@/modules/onboarding';
import { WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
import type { JobListItemDto } from '@/modules/jobs/types';

const columns: OperationalTableColumn<JobListItemDto>[] = [
  {
    id: 'title',
    header: 'Job',
    cell: (row) => <span className="font-medium">{row.title}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <WorkflowStatusBadge status={row.status} />,
  },
  {
    id: 'headcount',
    header: 'Headcount',
    hideOnMobile: true,
    cell: (row) => row.headcount,
  },
  {
    id: 'rate',
    header: 'Rate',
    hideOnMobile: true,
    cell: (row) => (row.rate_amount != null ? `$${row.rate_amount}` : '—'),
  },
  {
    id: 'skills',
    header: 'Required skills',
    hideOnMobile: true,
    cell: (row) => row.requiredSkillCount,
  },
];

type JobsTableFoundationProps = {
  data?: JobListItemDto[];
  isLoading?: boolean;
};

export function JobsTableFoundation({ data = [], isLoading }: JobsTableFoundationProps) {
  return (
    <OperationalTable
      caption="Event jobs"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={<JobsEmptyState />}
      emptyMessage="No jobs for this event."
    />
  );
}
