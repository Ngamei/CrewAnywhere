'use client';

import { ProposalsEmptyState } from '@/modules/onboarding';
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

export function ProposalsReviewTableFoundation({ data = [] }: { data?: ProposalListItemDto[] }) {
  return (
    <OperationalTable
      caption="Proposals for review"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      emptyState={<ProposalsEmptyState />}
      emptyMessage="No proposals to review."
    />
  );
}
