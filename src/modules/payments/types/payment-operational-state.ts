import type { PaymentStatus } from '@/shared/state/enums/payment-status';
import { PAYMENT_WORKFLOW_TRANSITIONS } from '@/shared/state/workflows/payment-lifecycle';
import type { WorkflowStatusTone } from '@/shared/design/tokens/colors';
import { formatWorkflowStatusLabel, resolveWorkflowStatusTone } from '@/shared/components/operational/workflow-status-tone';

export type PaymentOperationalPhase =
  | 'authorization'
  | 'escrow_funding'
  | 'held'
  | 'release'
  | 'refund'
  | 'terminal_failure'
  | 'terminal_cancelled';

export type PaymentOperationalState = {
  status: PaymentStatus;
  phase: PaymentOperationalPhase;
  label: string;
  tone: WorkflowStatusTone;
  isTerminal: boolean;
  allowedTransitionNames: string[];
  crewVisible: boolean;
  businessVisible: boolean;
};

const TERMINAL_STATUSES: PaymentStatus[] = ['released', 'refunded', 'failed', 'cancelled'];

const PHASE_BY_STATUS: Record<PaymentStatus, PaymentOperationalPhase> = {
  pending: 'authorization',
  authorized: 'escrow_funding',
  funded: 'held',
  released: 'release',
  refunded: 'refund',
  failed: 'terminal_failure',
  cancelled: 'terminal_cancelled',
};

function transitionsFromStatus(status: PaymentStatus): string[] {
  return PAYMENT_WORKFLOW_TRANSITIONS.filter((rule) => rule.from === status).map((rule) => rule.name);
}

export function resolvePaymentOperationalState(status: PaymentStatus): PaymentOperationalState {
  const isTerminal = TERMINAL_STATUSES.includes(status);
  return {
    status,
    phase: PHASE_BY_STATUS[status],
    label: formatWorkflowStatusLabel(status),
    tone: resolveWorkflowStatusTone(status),
    isTerminal,
    allowedTransitionNames: isTerminal ? [] : transitionsFromStatus(status),
    crewVisible: status !== 'pending' && status !== 'authorized',
    businessVisible: true,
  };
}

export function resolvePaymentListOperationalLabel(status: PaymentStatus): string {
  return resolvePaymentOperationalState(status).label;
}
