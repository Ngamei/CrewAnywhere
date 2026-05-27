import { KYC_STATUSES } from '../enums/kyc-status';
import { defineWorkflowMachine } from './define-workflow-machine';
import { buildVerificationWorkflowTransitions } from './verification-workflow-graph';

export const KYC_WORKFLOW_TRANSITIONS = buildVerificationWorkflowTransitions({
  sortOrderBase: 700,
  creationGuardKeys: ['crew_exists'],
  names: {
    create: 'create_kyc_record',
    submit: 'submit_kyc',
    expireUnsubmitted: 'expire_unsubmitted_kyc',
    approve: 'approve_kyc',
    requestInformation: 'request_kyc_information',
    reject: 'reject_kyc',
    expireSubmitted: 'expire_submitted_kyc',
    revoke: 'revoke_kyc',
    resubmit: 'resubmit_kyc',
    retry: 'retry_kyc',
  },
});

export type KycTransitionName = (typeof KYC_WORKFLOW_TRANSITIONS)[number]['name'];

export const kycWorkflowMachine = defineWorkflowMachine({
  entityType: 'kyc',
  statuses: KYC_STATUSES,
  transitions: KYC_WORKFLOW_TRANSITIONS,
  source: 'schema.sql#workflow_transition_rules',
});
