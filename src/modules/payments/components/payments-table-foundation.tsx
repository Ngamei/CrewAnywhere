'use client';

import { WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
import type { PaymentListItemDto } from '@/modules/payments/types';
import { resolvePaymentListOperationalLabel } from '@/modules/payments/types';

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

const placeholder: PaymentListItemDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000050',
    assignment_id: '00000000-0000-0000-0000-000000000045',
    company_profile_id: '00000000-0000-0000-0000-000000000010',
    crew_user_id: '00000000-0000-0000-0000-000000000040',
    amount: '450.00',
    currency: 'USD',
    status: 'funded',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    escrowStatus: 'held',
    operationalLabel: resolvePaymentListOperationalLabel('funded'),
  },
];

type PaymentsTableFoundationProps = {
  data?: PaymentListItemDto[];
  isLoading?: boolean;
};

export function PaymentsTableFoundation({ data = placeholder, isLoading }: PaymentsTableFoundationProps) {
  return (
    <OperationalTable
      caption="Payments by assignment"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      emptyMessage="No payments yet."
      isLoading={isLoading}
    />
  );
}
