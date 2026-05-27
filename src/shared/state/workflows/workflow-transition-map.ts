import type { WorkflowEntityType } from '../enums/workflow-entity-type';
import type { WorkflowEntityStatusMap } from '../types/workflow-entity-status';
import type { AssignmentTransitionName } from './assignment-lifecycle';
import type { KybTransitionName } from './kyb-lifecycle';
import type { KycTransitionName } from './kyc-lifecycle';
import type { PaymentTransitionName } from './payment-lifecycle';
import type { ProposalTransitionName } from './proposal-lifecycle';
import type { ShiftTransitionName } from './shift-lifecycle';
import type { WithdrawalTransitionName } from './withdrawal-lifecycle';

/** Transition label (`transition_name`) unions per workflow entity. */
export type WorkflowTransitionNameMap = {
  proposal: ProposalTransitionName;
  assignment: AssignmentTransitionName;
  shift: ShiftTransitionName;
  payment: PaymentTransitionName;
  withdrawal: WithdrawalTransitionName;
  kyb: KybTransitionName;
  kyc: KycTransitionName;
};

export type WorkflowTransitionNameFor<T extends WorkflowEntityType> =
  WorkflowTransitionNameMap[T];

/** Persisted status values for a workflow entity (from shared enums). */
export type WorkflowStatusesFor<T extends WorkflowEntityType> = WorkflowEntityStatusMap[T];
