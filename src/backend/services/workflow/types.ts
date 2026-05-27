import type { WorkflowEntityType } from '@/shared/state/enums/workflow-entity-type';
import type { WorkflowTransitionSource } from '@/shared/state/enums/workflow-transition-source';

export type WorkflowGuardCheck = {
  key: string;
  passed: boolean;
  detail?: string;
};

export type WorkflowGuardResult = {
  passed: boolean;
  checks: WorkflowGuardCheck[];
};

export type WorkflowTransitionCommand = {
  entityType: WorkflowEntityType;
  entityId: string;
  toStatus: string;
  transitionReason: string;
  transitionedBy: string;
  transitionSource: WorkflowTransitionSource;
  guardResult: WorkflowGuardResult;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
  correlationId?: string;
  expectedFromStatus?: string | null;
  expectedFromStatusVersion?: number | null;
};

/** Row shape returned by `transition_workflow_entity`. */
export type WorkflowTransitionEventRecord = {
  workflow_event_id: string;
  transition_rule_id: string;
  transition_rule_version: number;
  entity_type: WorkflowEntityType;
  entity_id: string;
  from_status: string | null;
  from_status_version: number | null;
  to_status: string;
  to_status_version: number;
  transition_reason: string;
  transitioned_by: string | null;
  transition_source: WorkflowTransitionSource;
  idempotency_key: string;
  correlation_id: string;
  realtime_topic: string | null;
  guard_result: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
};
