import { PAYMENT_STATUSES } from '../enums/payment-status';
import { defineWorkflowMachine, workflowRuleMetadata } from './define-workflow-machine';

const REALTIME_TOPIC = 'workflow.payments';

export const PAYMENT_WORKFLOW_TRANSITIONS = [
  {
    from: null,
    to: 'pending',
    name: 'create_payment',
    metadata: workflowRuleMetadata({
      guardKeys: ['assignment_created'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 300,
    }),
  },
  {
    from: 'pending',
    to: 'authorized',
    name: 'authorize_payment',
    metadata: workflowRuleMetadata({
      guardKeys: ['business_payment_method_valid'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 310,
    }),
  },
  {
    from: 'pending',
    to: 'failed',
    name: 'payment_authorization_failed',
    metadata: workflowRuleMetadata({
      guardKeys: ['provider_failure_recorded'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 320,
    }),
  },
  {
    from: 'pending',
    to: 'cancelled',
    name: 'cancel_pending_payment',
    metadata: workflowRuleMetadata({
      guardKeys: ['assignment_cancelled_or_admin'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 330,
    }),
  },
  {
    from: 'authorized',
    to: 'funded',
    name: 'fund_escrow',
    metadata: workflowRuleMetadata({
      guardKeys: ['escrow_funded', 'ledger_group_balanced'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 340,
    }),
  },
  {
    from: 'authorized',
    to: 'failed',
    name: 'funding_failed',
    metadata: workflowRuleMetadata({
      guardKeys: ['provider_failure_recorded'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 350,
    }),
  },
  {
    from: 'authorized',
    to: 'cancelled',
    name: 'cancel_authorized_payment',
    metadata: workflowRuleMetadata({
      guardKeys: ['escrow_not_funded'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 360,
    }),
  },
  {
    from: 'funded',
    to: 'released',
    name: 'release_payment',
    metadata: workflowRuleMetadata({
      guardKeys: ['shift_completed', 'attendance_validated', 'ledger_group_balanced'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 370,
    }),
  },
  {
    from: 'funded',
    to: 'refunded',
    name: 'refund_funded_payment',
    metadata: workflowRuleMetadata({
      guardKeys: ['refund_approved', 'ledger_group_balanced'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 380,
    }),
  },
  {
    from: 'released',
    to: 'refunded',
    name: 'refund_released_payment',
    metadata: workflowRuleMetadata({
      guardKeys: ['dispute_approved', 'ledger_reversal_created'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 390,
    }),
  },
] as const;

export type PaymentTransitionName = (typeof PAYMENT_WORKFLOW_TRANSITIONS)[number]['name'];

export const paymentWorkflowMachine = defineWorkflowMachine({
  entityType: 'payment',
  statuses: PAYMENT_STATUSES,
  transitions: PAYMENT_WORKFLOW_TRANSITIONS,
  source: 'schema.sql#workflow_transition_rules',
});
