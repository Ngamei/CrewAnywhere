'use client';

import { MarketplaceEmptyState } from '@/modules/onboarding';
import { WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
import type { MarketplaceJobListingDto } from '@/modules/marketplace/types';

const columns: OperationalTableColumn<MarketplaceJobListingDto>[] = [
  {
    id: 'title',
    header: 'Role',
    cell: (row) => (
      <div>
        <p className="font-medium">{row.title}</p>
        <p className="text-xs text-muted-foreground">{row.companyName ?? 'Company'}</p>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <WorkflowStatusBadge status={row.status} />,
  },
  {
    id: 'rate',
    header: 'Rate',
    hideOnMobile: true,
    cell: (row) => (row.rate_amount != null ? `${row.rate_currency} ${row.rate_amount}` : '—'),
  },
  {
    id: 'skills',
    header: 'Skills',
    hideOnMobile: true,
    cell: (row) => row.skills.map((s) => s.skill_name).join(', ') || '—',
  },
];

export function MarketplaceListingFoundation({ data = [] }: { data?: MarketplaceJobListingDto[] }) {
  return (
    <OperationalTable
      caption="Marketplace jobs"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      emptyState={<MarketplaceEmptyState />}
      emptyMessage="No open jobs match your filters."
    />
  );
}
