import type { WorkflowEntityType } from '../enums/workflow-entity-type';
import { assignmentWorkflowMachine } from './assignment-lifecycle';
import { kybWorkflowMachine } from './kyb-lifecycle';
import { kycWorkflowMachine } from './kyc-lifecycle';
import { paymentWorkflowMachine } from './payment-lifecycle';
import { proposalWorkflowMachine } from './proposal-lifecycle';
import { shiftWorkflowMachine } from './shift-lifecycle';
import { withdrawalWorkflowMachine } from './withdrawal-lifecycle';

/**
 * All workflow machines keyed by `workflow_entity_type`.
 * Transition rules are mirrored from Postgres; execution remains DB-authoritative.
 */
export const WORKFLOW_MACHINES = {
  proposal: proposalWorkflowMachine,
  assignment: assignmentWorkflowMachine,
  shift: shiftWorkflowMachine,
  payment: paymentWorkflowMachine,
  withdrawal: withdrawalWorkflowMachine,
  kyb: kybWorkflowMachine,
  kyc: kycWorkflowMachine,
} as const;

export type WorkflowMachineRegistry = typeof WORKFLOW_MACHINES;
export type WorkflowMachineFor<T extends WorkflowEntityType> = WorkflowMachineRegistry[T];

export function getWorkflowMachine<T extends WorkflowEntityType>(
  entityType: T,
): WorkflowMachineFor<T> {
  return WORKFLOW_MACHINES[entityType];
}
