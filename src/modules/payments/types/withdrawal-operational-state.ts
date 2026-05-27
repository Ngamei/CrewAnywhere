import type { WithdrawalStatus } from '@/shared/state/enums/withdrawal-status';
import { WITHDRAWAL_WORKFLOW_TRANSITIONS } from '@/shared/state/workflows/withdrawal-lifecycle';
import type { WorkflowStatusTone } from '@/shared/design/tokens/colors';
import { formatWorkflowStatusLabel, resolveWorkflowStatusTone } from '@/shared/components/operational/workflow-status-tone';

export type WithdrawalOperationalPhase =
  | 'request'
  | 'review'
  | 'approval'
  | 'processing'
  | 'paid'
  | 'terminal_rejected'
  | 'terminal_cancelled';

export type WithdrawalOperationalState = {
  status: WithdrawalStatus;
  phase: WithdrawalOperationalPhase;
  label: string;
  tone: WorkflowStatusTone;
  isTerminal: boolean;
  allowedTransitionNames: string[];
};

const TERMINAL_STATUSES: WithdrawalStatus[] = ['paid', 'rejected', 'cancelled'];

const PHASE_BY_STATUS: Record<WithdrawalStatus, WithdrawalOperationalPhase> = {
  requested: 'request',
  under_review: 'review',
  approved: 'approval',
  processing: 'processing',
  paid: 'paid',
  rejected: 'terminal_rejected',
  cancelled: 'terminal_cancelled',
};

function transitionsFromStatus(status: WithdrawalStatus): string[] {
  return WITHDRAWAL_WORKFLOW_TRANSITIONS.filter((rule) => rule.from === status).map((rule) => rule.name);
}

export function resolveWithdrawalOperationalState(status: WithdrawalStatus): WithdrawalOperationalState {
  const isTerminal = TERMINAL_STATUSES.includes(status);
  return {
    status,
    phase: PHASE_BY_STATUS[status],
    label: formatWorkflowStatusLabel(status),
    tone: resolveWorkflowStatusTone(status),
    isTerminal,
    allowedTransitionNames: isTerminal ? [] : transitionsFromStatus(status),
  };
}
