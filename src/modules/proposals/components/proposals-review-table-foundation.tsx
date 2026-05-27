'use client';

import { WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
import type { ProposalListItemDto } from '@/modules/proposals/types';

const columns: OperationalTableColumn<ProposalListItemDto>[] = [
  {
    id: 'crew',
    header: 'Crew',
    cell: (row) => <span className="font-mono text-xs">{row.crew_user_id.slice(0, 8)}…</span>,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <WorkflowStatusBadge status={row.status} />,
  },
  {
    id: 'submitted',
    header: 'Submitted',
    hideOnMobile: true,
    cell: (row) => new Date(row.submitted_at).toLocaleDateString(),
  },
  {
    id: 'note',
    header: 'Cover note',
    hideOnMobile: true,
    cell: (row) => row.coverNotePreview ?? '—',
  },
];

const placeholder: ProposalListItemDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000030',
    job_id: '00000000-0000-0000-0000-000000000020',
    crew_user_id: '00000000-0000-0000-0000-000000000040',
    status: 'applied',
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coverNotePreview: 'Experienced stage crew with 5+ festivals…',
  },
];

export function ProposalsReviewTableFoundation({ data = placeholder }: { data?: ProposalListItemDto[] }) {
  return (
    <OperationalTable
      caption="Proposals for review"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      emptyMessage="No proposals to review."
    />
  );
}
