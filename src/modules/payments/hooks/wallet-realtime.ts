import type { WorkflowEventPayload } from '@/shared/events';
import { paymentQueryKeys } from './payment-query-keys';
import { walletQueryKeys } from './wallet-query-keys';

export const PAYMENT_WORKFLOW_REALTIME_TOPIC = 'workflow.payments' as const;
export const WITHDRAWAL_WORKFLOW_REALTIME_TOPIC = 'workflow.withdrawals' as const;
export const WORKFLOW_TRANSITION_BROADCAST_EVENT = 'workflow_transition' as const;

export type WalletRealtimeSubscriptionOptions = {
  crewUserId?: string;
  paymentId?: string;
  enabled?: boolean;
};

export function isPaymentActivityPayload(value: unknown): value is WorkflowEventPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return payload.entity_type === 'payment' && typeof payload.entity_id === 'string';
}

export function isWithdrawalActivityPayload(value: unknown): value is WorkflowEventPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return payload.entity_type === 'withdrawal' && typeof payload.entity_id === 'string';
}

export function parseWorkflowActivityPayload(value: unknown): WorkflowEventPayload | null {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Record<string, unknown>;
  if (typeof payload.entity_id !== 'string' || typeof payload.entity_type !== 'string') {
    return null;
  }
  return value as WorkflowEventPayload;
}

export function getPaymentInvalidationKeys(
  payload: WorkflowEventPayload,
  filters: { crewUserId?: string } = {},
): readonly (readonly unknown[])[] {
  const keys: (readonly unknown[])[] = [
    paymentQueryKeys.all,
    paymentQueryKeys.list({ crewUserId: filters.crewUserId }),
    paymentQueryKeys.detail(payload.entity_id),
    paymentQueryKeys.timeline(payload.entity_id),
    paymentQueryKeys.escrow(payload.entity_id),
    paymentQueryKeys.ledgerHistory(payload.entity_id),
  ];

  if (filters.crewUserId) {
    keys.push(
      walletQueryKeys.balance(filters.crewUserId),
      walletQueryKeys.activity(filters.crewUserId),
      walletQueryKeys.byCrewUser(filters.crewUserId),
    );
  }

  return keys;
}

export function getWithdrawalInvalidationKeys(
  payload: WorkflowEventPayload,
  filters: { crewUserId?: string; paymentId?: string } = {},
): readonly (readonly unknown[])[] {
  const keys: (readonly unknown[])[] = [walletQueryKeys.all, paymentQueryKeys.all];

  if (filters.crewUserId) {
    keys.push(
      walletQueryKeys.withdrawals(filters.crewUserId),
      walletQueryKeys.balance(filters.crewUserId),
      walletQueryKeys.activity(filters.crewUserId),
      walletQueryKeys.byCrewUser(filters.crewUserId),
    );
  }

  if (filters.paymentId) {
    keys.push(
      paymentQueryKeys.detail(filters.paymentId),
      paymentQueryKeys.withdrawal(filters.paymentId),
    );
  }

  return keys;
}
