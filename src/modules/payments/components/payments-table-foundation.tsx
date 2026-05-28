'use client';

import { PaymentsEmptyState } from '@/modules/onboarding';
import { WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
import type { PaymentListItemDto } from '@/modules/payments/types';
const columns: OperationalTableColumn<PaymentListItemDto>[] = [
  {
    id: 'assignment',
    header: 'Assignment',
    cell: (row) => <span className="font-mono text-xs">{row.assignment_id.slice(0, 8)}…</span>,
  },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => (
      <span className="tabular-nums">
        {row.amount} {row.currency}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Payment',
    cell: (row) => <WorkflowStatusBadge status={row.status} />,
  },
  {
    id: 'escrow',
    header: 'Escrow',
    hideOnMobile: true,
    cell: (row) =>
      row.escrowStatus ? <WorkflowStatusBadge status={row.escrowStatus} /> : <span className="text-muted-foreground">—</span>,
  },
  {
    id: 'label',
    header: 'Operational',
    hideOnMobile: true,
    cell: (row) => row.operationalLabel,
  },
  {
    id: 'updated',
    header: 'Updated',
    hideOnMobile: true,
    cell: (row) => new Date(row.updated_at).toLocaleDateString(),
  },
];

type PaymentsTableFoundationProps = {
  data?: PaymentListItemDto[];
  isLoading?: boolean;
};

export function PaymentsTableFoundation({ data = [], isLoading }: PaymentsTableFoundationProps) {
  return (
    <OperationalTable
      caption="Payments by assignment"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      emptyState={<PaymentsEmptyState />}
      emptyMessage="No payments yet."
      isLoading={isLoading}
    />
  );
}
