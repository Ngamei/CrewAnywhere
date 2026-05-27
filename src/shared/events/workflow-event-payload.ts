import type { EntityId, ISODateTime } from '@/domain';

export type WorkflowEventPayload = {
  workflow_event_id: EntityId;
  entity_type: string;
  entity_id: EntityId;
  from_status: string | null;
  from_status_version: number | null;
  to_status: string;
  to_status_version: number;
  transition_rule_id: EntityId;
  transition_rule_version: number;
  correlation_id: EntityId;
  transition_source: string;
  created_at: ISODateTime;
};
