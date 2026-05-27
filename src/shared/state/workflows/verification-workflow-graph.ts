import type { VerificationStatus } from '../enums/verification-status';
import { workflowRuleMetadata } from './define-workflow-machine';
import type { WorkflowTransitionMetadata } from './types';

const REALTIME_TOPIC = 'workflow.verification';

type VerificationTransitionSpec = {
  readonly from: VerificationStatus | null;
  readonly to: VerificationStatus;
  readonly guardKeys: readonly string[];
  readonly isTerminal: boolean;
  readonly sortOrderOffset: number;
};

/**
 * Shared verification lifecycle graph (KYB/KYC).
 * Entity-specific transition names and sort-order bases are applied by callers.
 */
export const VERIFICATION_WORKFLOW_GRAPH: readonly VerificationTransitionSpec[] = [
  {
    from: null,
    to: 'pending',
    guardKeys: [],
    isTerminal: false,
    sortOrderOffset: 0,
  },
  {
    from: 'pending',
    to: 'submitted',
    guardKeys: ['documents_attached'],
    isTerminal: false,
    sortOrderOffset: 10,
  },
  {
    from: 'pending',
    to: 'expired',
    guardKeys: ['deadline_expired'],
    isTerminal: true,
    sortOrderOffset: 20,
  },
  {
    from: 'submitted',
    to: 'approved',
    guardKeys: ['provider_approved'],
    isTerminal: true,
    sortOrderOffset: 30,
  },
  {
    from: 'submitted',
    to: 'additional_info_requested',
    guardKeys: ['provider_requested_info'],
    isTerminal: false,
    sortOrderOffset: 40,
  },
  {
    from: 'submitted',
    to: 'rejected',
    guardKeys: ['provider_rejected'],
    isTerminal: true,
    sortOrderOffset: 50,
  },
  {
    from: 'submitted',
    to: 'expired',
    guardKeys: ['provider_deadline_expired'],
    isTerminal: true,
    sortOrderOffset: 60,
  },
  {
    from: 'approved',
    to: 'revoked',
    guardKeys: ['compliance_review_failed'],
    isTerminal: true,
    sortOrderOffset: 70,
  },
  {
    from: 'additional_info_requested',
    to: 'submitted',
    guardKeys: ['additional_info_uploaded'],
    isTerminal: false,
    sortOrderOffset: 80,
  },
  {
    from: 'rejected',
    to: 'submitted',
    guardKeys: ['retry_allowed'],
    isTerminal: false,
    sortOrderOffset: 90,
  },
] as const;

export type VerificationTransitionNameKey =
  | 'create'
  | 'submit'
  | 'expireUnsubmitted'
  | 'approve'
  | 'requestInformation'
  | 'reject'
  | 'expireSubmitted'
  | 'revoke'
  | 'resubmit'
  | 'retry';

const GRAPH_NAME_KEYS: readonly VerificationTransitionNameKey[] = [
  'create',
  'submit',
  'expireUnsubmitted',
  'approve',
  'requestInformation',
  'reject',
  'expireSubmitted',
  'revoke',
  'resubmit',
  'retry',
];

export function buildVerificationWorkflowTransitions<
  const TNames extends Record<VerificationTransitionNameKey, string>,
>(config: {
  names: TNames;
  sortOrderBase: number;
  creationGuardKeys: readonly string[];
}): {
  readonly from: VerificationStatus | null;
  readonly to: VerificationStatus;
  readonly name: TNames[VerificationTransitionNameKey];
  readonly metadata: WorkflowTransitionMetadata;
}[] {
  return VERIFICATION_WORKFLOW_GRAPH.map((spec, index) => {
    const nameKey = GRAPH_NAME_KEYS[index];
    const guardKeys =
      spec.from === null ? config.creationGuardKeys : spec.guardKeys;

    return {
      from: spec.from,
      to: spec.to,
      name: config.names[nameKey],
      metadata: workflowRuleMetadata({
        guardKeys,
        requiresServiceRole: true,
        isTerminal: spec.isTerminal,
        realtimeTopic: REALTIME_TOPIC,
        sortOrder: config.sortOrderBase + spec.sortOrderOffset,
      }),
    };
  });
}
