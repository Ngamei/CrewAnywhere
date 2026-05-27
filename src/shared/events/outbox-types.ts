import type { EntityId, ISODateTime } from '@/domain';
import type { WorkflowEventPayload } from './workflow-event-payload';
import type { WorkflowOutboxStatus } from './workflow-outbox-status';

export type WorkflowOutboxRow = {
  id: EntityId;
  workflow_event_id: EntityId;
  topic: string;
  payload: WorkflowEventPayload;
  status: WorkflowOutboxStatus;
  attempts: number;
  next_attempt_at: ISODateTime;
  published_at: ISODateTime | null;
  last_error: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at: ISODateTime | null;
};

export type WorkflowOutboxPublishInput = {
  outboxId: EntityId;
  workflowEventId: EntityId;
  topic: string;
  payload: WorkflowEventPayload;
  attempts: number;
};
