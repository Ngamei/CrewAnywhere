'use client';

import { WorkflowStatusBadge } from '@/shared/components/operational';
import { resolvePaymentOperationalState } from '@/modules/payments/types';
import type { PaymentStatus } from '@/shared/state/enums/payment-status';

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
  showOperationalLabel?: boolean;
};

export function PaymentStatusBadge({ status, showOperationalLabel = false }: PaymentStatusBadgeProps) {
  const operational = resolvePaymentOperationalState(status);

  return (
    <WorkflowStatusBadge
      status={status}
      label={showOperationalLabel ? operational.label : undefined}
    />
  );
}
