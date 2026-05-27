'use client';

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

const placeholderRows: JobListItemDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    event_id: '00000000-0000-0000-0000-000000000001',
    company_profile_id: '00000000-0000-0000-0000-000000000002',
    title: 'Stage crew',
    status: 'draft',
    headcount: 4,
    rate_amount: 22,
    updated_at: new Date().toISOString(),
    requiredSkillCount: 2,
  },
];

type JobsTableFoundationProps = {
  data?: JobListItemDto[];
  isLoading?: boolean;
};

export function JobsTableFoundation({ data = placeholderRows, isLoading }: JobsTableFoundationProps) {
  return (
    <OperationalTable
      caption="Event jobs"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyMessage="No jobs for this event."
    />
  );
}
