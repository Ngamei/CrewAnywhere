import { WITHDRAWAL_STATUSES } from '../enums/withdrawal-status';
import { defineWorkflowMachine, workflowRuleMetadata } from './define-workflow-machine';

const REALTIME_TOPIC = 'workflow.withdrawals';

export const WITHDRAWAL_WORKFLOW_TRANSITIONS = [
  {
    from: null,
    to: 'requested',
    name: 'request_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['wallet_available_balance_sufficient', 'payout_method_verified'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 400,
    }),
  },
  {
    from: 'requested',
    to: 'under_review',
    name: 'review_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['risk_screen_required'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 410,
    }),
  },
  {
    from: 'requested',
    to: 'approved',
    name: 'approve_low_risk_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['risk_screen_passed', 'ledger_reservation_created'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 420,
    }),
  },
  {
    from: 'requested',
    to: 'rejected',
    name: 'reject_requested_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['risk_screen_failed'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 430,
    }),
  },
  {
    from: 'requested',
    to: 'cancelled',
    name: 'cancel_requested_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['crew_owns_withdrawal'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 440,
    }),
  },
  {
    from: 'under_review',
    to: 'approved',
    name: 'approve_reviewed_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['risk_screen_passed', 'ledger_reservation_created'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 450,
    }),
  },
  {
    from: 'under_review',
    to: 'rejected',
    name: 'reject_reviewed_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['risk_screen_failed', 'ledger_reservation_reversed'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 460,
    }),
  },
  {
    from: 'under_review',
    to: 'cancelled',
    name: 'cancel_reviewed_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['admin_or_crew_authorized', 'ledger_reservation_reversed'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 470,
    }),
  },
  {
    from: 'approved',
    to: 'processing',
    name: 'process_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['provider_payout_created'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 480,
    }),
  },
  {
    from: 'approved',
    to: 'rejected',
    name: 'reject_approved_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['provider_rejected', 'ledger_reservation_reversed'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 490,
    }),
  },
  {
    from: 'approved',
    to: 'cancelled',
    name: 'cancel_approved_withdrawal',
    metadata: workflowRuleMetadata({
      guardKeys: ['admin_authorized', 'ledger_reservation_reversed'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 500,
    }),
  },
  {
    from: 'processing',
    to: 'paid',
    name: 'mark_withdrawal_paid',
    metadata: workflowRuleMetadata({
      guardKeys: ['provider_payout_confirmed', 'ledger_payout_posted'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 510,
    }),
  },
  {
    from: 'processing',
    to: 'rejected',
    name: 'mark_withdrawal_failed',
    metadata: workflowRuleMetadata({
      guardKeys: ['provider_payout_failed', 'ledger_reservation_reversed'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 520,
    }),
  },
] as const;

export type WithdrawalTransitionName = (typeof WITHDRAWAL_WORKFLOW_TRANSITIONS)[number]['name'];

export const withdrawalWorkflowMachine = defineWorkflowMachine({
  entityType: 'withdrawal',
  statuses: WITHDRAWAL_STATUSES,
  transitions: WITHDRAWAL_WORKFLOW_TRANSITIONS,
  source: 'schema.sql#workflow_transition_rules',
});
