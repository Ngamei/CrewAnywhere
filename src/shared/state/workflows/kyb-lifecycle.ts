import { KYB_STATUSES } from '../enums/kyb-status';
import { defineWorkflowMachine } from './define-workflow-machine';
import { buildVerificationWorkflowTransitions } from './verification-workflow-graph';

export const KYB_WORKFLOW_TRANSITIONS = buildVerificationWorkflowTransitions({
  sortOrderBase: 600,
  creationGuardKeys: ['company_exists'],
  names: {
    create: 'create_kyb_record',
    submit: 'submit_kyb',
    expireUnsubmitted: 'expire_unsubmitted_kyb',
    approve: 'approve_kyb',
    requestInformation: 'request_kyb_information',
    reject: 'reject_kyb',
    expireSubmitted: 'expire_submitted_kyb',
    revoke: 'revoke_kyb',
    resubmit: 'resubmit_kyb',
    retry: 'retry_kyb',
  },
});

export type KybTransitionName = (typeof KYB_WORKFLOW_TRANSITIONS)[number]['name'];

export const kybWorkflowMachine = defineWorkflowMachine({
  entityType: 'kyb',
  statuses: KYB_STATUSES,
  transitions: KYB_WORKFLOW_TRANSITIONS,
  source: 'schema.sql#workflow_transition_rules',
});
