import { PROPOSAL_STATUSES } from '../enums/proposal-status';
import { defineWorkflowMachine, workflowRuleMetadata } from './define-workflow-machine';

const REALTIME_TOPIC = 'workflow.proposals';

export const PROPOSAL_WORKFLOW_TRANSITIONS = [
  {
    from: null,
    to: 'applied',
    name: 'create_proposal',
    metadata: workflowRuleMetadata({
      guardKeys: ['job_open', 'crew_marketplace_ready'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 10,
    }),
  },
  {
    from: 'applied',
    to: 'offer_sent',
    name: 'send_offer',
    metadata: workflowRuleMetadata({
      guardKeys: ['business_owns_job', 'proposal_active'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 20,
    }),
  },
  {
    from: 'applied',
    to: 'declined',
    name: 'decline_application',
    metadata: workflowRuleMetadata({
      guardKeys: ['business_owns_job'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 30,
    }),
  },
  {
    from: 'applied',
    to: 'withdrawn',
    name: 'withdraw_application',
    metadata: workflowRuleMetadata({
      guardKeys: ['crew_owns_proposal'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 40,
    }),
  },
  {
    from: 'offer_sent',
    to: 'offer_accepted',
    name: 'accept_offer',
    metadata: workflowRuleMetadata({
      guardKeys: ['crew_owns_proposal', 'offer_valid'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 50,
    }),
  },
  {
    from: 'offer_sent',
    to: 'declined',
    name: 'decline_offer',
    metadata: workflowRuleMetadata({
      guardKeys: ['crew_owns_proposal'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 60,
    }),
  },
  {
    from: 'offer_sent',
    to: 'withdrawn',
    name: 'withdraw_after_offer',
    metadata: workflowRuleMetadata({
      guardKeys: ['crew_owns_proposal'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 70,
    }),
  },
  {
    from: 'offer_accepted',
    to: 'hired',
    name: 'confirm_hire',
    metadata: workflowRuleMetadata({
      guardKeys: ['business_owns_job', 'payment_authorized'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 80,
    }),
  },
  {
    from: 'offer_accepted',
    to: 'withdrawn',
    name: 'withdraw_before_hire',
    metadata: workflowRuleMetadata({
      guardKeys: ['crew_owns_proposal'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 90,
    }),
  },
] as const;

export type ProposalTransitionName = (typeof PROPOSAL_WORKFLOW_TRANSITIONS)[number]['name'];

export const proposalWorkflowMachine = defineWorkflowMachine({
  entityType: 'proposal',
  statuses: PROPOSAL_STATUSES,
  transitions: PROPOSAL_WORKFLOW_TRANSITIONS,
  source: 'schema.sql#workflow_transition_rules',
});
