import type { PayoutStatusDisplay } from '@/modules/payments/types';
import type { WithdrawalRequestRecord } from '@/modules/payments/types/payment-records';
import type { WithdrawalStatus } from '@/shared/state/enums/withdrawal-status';
import { formatWorkflowStatusLabel, resolveWorkflowStatusTone } from '@/shared/components/operational/workflow-status-tone';

const TERMINAL_WITHDRAWAL_STATUSES: WithdrawalStatus[] = ['paid', 'rejected', 'cancelled'];

const WITHDRAWAL_STATUS_LABELS: Partial<Record<WithdrawalStatus, string>> = {
  under_review: 'Reviewing',
  rejected: 'Failed',
};

export function formatWithdrawalStatusLabel(status: WithdrawalStatus): string {
  return WITHDRAWAL_STATUS_LABELS[status] ?? formatWorkflowStatusLabel(status);
}

export function toPayoutStatusDisplay(
  withdrawal: WithdrawalRequestRecord,
  payoutMethodLabel: string | null = null,
): PayoutStatusDisplay {
  const isTerminal = TERMINAL_WITHDRAWAL_STATUSES.includes(withdrawal.status);
  return {
    withdrawalId: withdrawal.id,
    paymentId: withdrawal.payment_id,
    status: withdrawal.status,
    operationalLabel: formatWithdrawalStatusLabel(withdrawal.status),
    tone: resolveWorkflowStatusTone(withdrawal.status),
    amount: withdrawal.amount,
    currency: withdrawal.currency,
    requestedAt: withdrawal.requested_at,
    processedAt: withdrawal.processed_at,
    payoutMethodLabel,
    isTerminal,
  };
}
