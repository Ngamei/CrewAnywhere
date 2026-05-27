'use client';

import { WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
import type { EventListItemDto } from '@/modules/events/types';

const columns: OperationalTableColumn<EventListItemDto>[] = [
  {
    id: 'title',
    header: 'Event',
    cell: (row) => <span className="font-medium">{row.title}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <WorkflowStatusBadge status={row.status} />,
  },
  {
    id: 'schedule',
    header: 'Schedule',
    hideOnMobile: true,
    cell: (row) => (
      <span className="text-muted-foreground text-sm">
        {row.starts_at ? new Date(row.starts_at).toLocaleString() : '—'}
      </span>
    ),
  },
  {
    id: 'jobs',
    header: 'Open jobs',
    hideOnMobile: true,
    cell: (row) => row.openJobCount,
  },
];

const placeholderRows: EventListItemDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    company_profile_id: '00000000-0000-0000-0000-000000000002',
    title: 'Summer festival staffing',
    status: 'draft',
    starts_at: null,
    ends_at: null,
    city: 'London',
    published_at: null,
    updated_at: new Date().toISOString(),
    openJobCount: 0,
  },
];

type EventsTableFoundationProps = {
  data?: EventListItemDto[];
  isLoading?: boolean;
};

export function EventsTableFoundation({ data = placeholderRows, isLoading }: EventsTableFoundationProps) {
  return (
    <OperationalTable
      caption="Company events"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyMessage="No events yet. Create one to start staffing."
    />
  );
}
