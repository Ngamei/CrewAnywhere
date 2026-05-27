'use client';

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

const placeholder: MarketplaceJobListingDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000020',
    event_id: '00000000-0000-0000-0000-000000000001',
    company_profile_id: '00000000-0000-0000-0000-000000000002',
    created_by_business_user_id: '00000000-0000-0000-0000-000000000003',
    title: 'Stage crew',
    description: null,
    headcount: 4,
    rate_amount: 25,
    rate_currency: 'USD',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    skills: [{ id: '1', job_id: 'x', skill_name: 'Rigging', skill_category: null, required: true, sort_order: 0, created_at: '', updated_at: '', deleted_at: null }],
    eventTitle: 'Summer festival',
    eventStartsAt: null,
    eventEndsAt: null,
    companyName: 'Acme Events',
    marketplaceVisible: true,
  },
];

export function MarketplaceListingFoundation({ data = placeholder }: { data?: MarketplaceJobListingDto[] }) {
  return (
    <OperationalTable
      caption="Marketplace jobs"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      emptyMessage="No open jobs match your filters."
    />
  );
}
