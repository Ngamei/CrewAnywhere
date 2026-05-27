import type { WorkflowOutboxPublishInput } from '@/shared/events';

export type WorkflowEventPublisher = {
  publish(input: WorkflowOutboxPublishInput): Promise<void>;
};

export type WorkflowPublisherLogContext = {
  requestId?: string;
  workerId?: string;
};

/**
 * Minimal publisher that logs dispatch intent.
 * Replace or compose with realtime/webhook publishers without changing worker semantics.
 */
export class LoggingWorkflowEventPublisher implements WorkflowEventPublisher {
  constructor(private readonly context: WorkflowPublisherLogContext = {}) {}

  async publish(input: WorkflowOutboxPublishInput) {
    console.info('[workflow-outbox] publish', {
      requestId: this.context.requestId,
      workerId: this.context.workerId,
      outboxId: input.outboxId,
      workflowEventId: input.workflowEventId,
      topic: input.topic,
      entityType: input.payload.entity_type,
      entityId: input.payload.entity_id,
      toStatus: input.payload.to_status,
      toStatusVersion: input.payload.to_status_version,
      correlationId: input.payload.correlation_id,
    });
  }
}
