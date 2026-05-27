import type { AssignmentStatus } from '../enums/assignment-status';
import type { KybStatus } from '../enums/kyb-status';
import type { KycStatus } from '../enums/kyc-status';
import type { PaymentStatus } from '../enums/payment-status';
import type { ProposalStatus } from '../enums/proposal-status';
import type { ShiftStatus } from '../enums/shift-status';
import type { WithdrawalStatus } from '../enums/withdrawal-status';
import type { WorkflowEntityType } from '../enums/workflow-entity-type';
import type { WorkflowTransitionSource } from '../enums/workflow-transition-source';

/** Maps each workflow entity type to its persisted status enum value. */
export type WorkflowEntityStatusMap = {
  proposal: ProposalStatus;
  assignment: AssignmentStatus;
  shift: ShiftStatus;
  payment: PaymentStatus;
  withdrawal: WithdrawalStatus;
  kyb: KybStatus;
  kyc: KycStatus;
};

export type WorkflowEntityStatus<T extends WorkflowEntityType = WorkflowEntityType> =
  WorkflowEntityStatusMap[T];

/** Status string accepted by `transition_workflow_entity` for a given entity type. */
export type WorkflowStatusForEntity<T extends WorkflowEntityType> =
  WorkflowEntityStatusMap[T];

/**
 * Cross-entity workflow status union (serialized as text in transition events).
 * Prefer `WorkflowEntityStatus<T>` when the entity type is known.
 */
export type AnyWorkflowEntityStatus = WorkflowEntityStatusMap[WorkflowEntityType];

export type WorkflowTransitionActor = {
  transitionedBy: string | null;
  transitionSource: WorkflowTransitionSource;
};

export type WorkflowStatusSnapshot<T extends WorkflowEntityType = WorkflowEntityType> = {
  entityType: T;
  entityId: string;
  status: WorkflowEntityStatus<T>;
  statusVersion: number;
};
