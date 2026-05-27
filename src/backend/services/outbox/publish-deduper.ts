import type { EntityId } from '@/domain';

/**
 * Process-local dedupe guard for replay-safe publishing.
 * Cross-worker dedupe is enforced by outbox status + workflow_event_id uniqueness.
 */
export class WorkflowPublishDeduper {
  private readonly publishedWorkflowEventIds = new Set<EntityId>();

  wasPublished(workflowEventId: EntityId) {
    return this.publishedWorkflowEventIds.has(workflowEventId);
  }

  markPublished(workflowEventId: EntityId) {
    this.publishedWorkflowEventIds.add(workflowEventId);
  }

  clear() {
    this.publishedWorkflowEventIds.clear();
  }
}
