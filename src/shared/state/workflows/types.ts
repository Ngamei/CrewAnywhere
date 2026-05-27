import type { WorkflowEntityType } from '../enums/workflow-entity-type';
import type { WorkflowEntityStatusMap } from '../types/workflow-entity-status';

/**
 * Metadata mirrored from `public.workflow_transition_rules` columns.
 * Postgres remains authoritative; this shape is for orchestration clients only.
 */
export type WorkflowTransitionMetadata = {
  readonly guardKeys: readonly string[];
  readonly requiresServiceRole: boolean;
  readonly isTerminal: boolean;
  readonly realtimeTopic: string;
  readonly sortOrder: number;
  readonly ruleVersion: 1;
};

/**
 * One allowed edge in a workflow machine.
 * `name` matches `workflow_transition_rules.transition_name` (transition label/key).
 */
export type WorkflowTransitionDefinition<
  TEntityType extends WorkflowEntityType,
  TStatus extends WorkflowEntityStatusMap[TEntityType],
  TName extends string,
> = {
  readonly from: TStatus | null;
  readonly to: TStatus;
  readonly name: TName;
  readonly metadata: WorkflowTransitionMetadata;
};

export type WorkflowTransitionKey<TStatus extends string> =
  | `${TStatus}->${TStatus}`
  | `__initial__->${TStatus}`;

export type WorkflowMachineDefinition<
  TEntityType extends WorkflowEntityType,
  TStatus extends WorkflowEntityStatusMap[TEntityType],
  TTransitions extends readonly WorkflowTransitionDefinition<TEntityType, TStatus, string>[],
> = {
  readonly entityType: TEntityType;
  readonly statuses: readonly TStatus[];
  readonly transitions: TTransitions;
  /** Provenance for reviewers — values must match `schema.sql` seed data. */
  readonly source: 'schema.sql#workflow_transition_rules';
};
