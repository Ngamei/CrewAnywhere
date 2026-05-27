import type { WorkflowOutboxPublishInput } from '@/shared/events';
import type { WorkflowEventPublisher } from './workflow-event-publisher';

export type WorkflowTopicHandler = {
  topic: string;
  publish: WorkflowEventPublisher['publish'];
};

/**
 * Routes outbox rows to topic-specific publishers.
 * Unregistered topics fall back to the default publisher.
 */
export class WorkflowEventDispatcher {
  private readonly handlers = new Map<string, WorkflowEventPublisher['publish']>();

  constructor(private readonly defaultPublisher: WorkflowEventPublisher) {}

  registerHandler(handler: WorkflowTopicHandler) {
    this.handlers.set(handler.topic, handler.publish);
  }

  async dispatch(input: WorkflowOutboxPublishInput) {
    const handler = this.handlers.get(input.topic) ?? this.defaultPublisher.publish.bind(this.defaultPublisher);
    await handler(input);
  }
}
