import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkflowOutboxRow } from '@/shared/events';
import { OUTBOX_WORKER_DEFAULTS } from './constants';
import { WorkflowEventDispatcher, type WorkflowTopicHandler } from './event-dispatcher';
import { WorkflowOutboxRepository } from './outbox-repository';
import { OutboxWorkerMetrics } from './outbox-worker-metrics';
import { WorkflowPublishDeduper } from './publish-deduper';
import { createDefaultOutboxRetryPolicy } from './retry-policy';
import type { WorkflowEventPublisher } from './workflow-event-publisher';

export type OutboxWorkerServiceOptions = {
  supabase: SupabaseClient;
  publisher: WorkflowEventPublisher;
  batchSize?: number;
  processingLeaseSeconds?: number;
  deduper?: WorkflowPublishDeduper;
  metrics?: OutboxWorkerMetrics;
  topicHandlers?: WorkflowTopicHandler[];
};

function toPublishInput(row: WorkflowOutboxRow) {
  return {
    outboxId: row.id,
    workflowEventId: row.workflow_event_id,
    topic: row.topic,
    payload: row.payload,
    attempts: row.attempts,
  };
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export class OutboxWorkerService {
  private readonly repository: WorkflowOutboxRepository;
  private readonly dispatcher: WorkflowEventDispatcher;
  private readonly deduper: WorkflowPublishDeduper;
  private readonly metrics: OutboxWorkerMetrics;
  private readonly retryPolicy = createDefaultOutboxRetryPolicy();
  private readonly batchSize: number;
  private readonly processingLeaseSeconds: number;

  constructor(private readonly options: OutboxWorkerServiceOptions) {
    this.repository = new WorkflowOutboxRepository(options.supabase);
    this.dispatcher = new WorkflowEventDispatcher(options.publisher);
    this.deduper = options.deduper ?? new WorkflowPublishDeduper();
    this.metrics = options.metrics ?? new OutboxWorkerMetrics();
    this.batchSize = options.batchSize ?? OUTBOX_WORKER_DEFAULTS.batchSize;
    this.processingLeaseSeconds =
      options.processingLeaseSeconds ?? OUTBOX_WORKER_DEFAULTS.processingLeaseSeconds;

    for (const handler of options.topicHandlers ?? []) {
      this.dispatcher.registerHandler(handler);
    }
  }

  getMetrics() {
    return this.metrics.getSnapshot();
  }

  async processOnce() {
    this.metrics.recordPoll();

    const claimed = await this.repository.claimBatch({
      batchSize: this.batchSize,
      processingLeaseSeconds: this.processingLeaseSeconds,
    });

    this.metrics.recordClaimed(claimed.length);

    for (const row of claimed) {
      await this.processClaimedRow(row);
    }

    return {
      claimed: claimed.length,
      metrics: this.getMetrics(),
    };
  }

  private async processClaimedRow(row: WorkflowOutboxRow) {
    const publishInput = toPublishInput(row);

    try {
      if (this.deduper.wasPublished(row.workflow_event_id)) {
        await this.repository.completePublish(row.id);
        this.metrics.recordDeduped();
        return;
      }

      await this.dispatcher.dispatch(publishInput);
      this.deduper.markPublished(row.workflow_event_id);

      const completed = await this.repository.completePublish(row.id);

      if (completed.status === 'published') {
        this.metrics.recordPublished();
      }
    } catch (error) {
      const message = formatError(error);
      const failed = await this.repository.failPublish({
        outboxId: row.id,
        error: message,
        retryPolicy: this.retryPolicy,
      });

      if (failed.status === 'dead_lettered') {
        this.metrics.recordDeadLettered(message);
        console.error('[workflow-outbox] dead-lettered', {
          outboxId: row.id,
          workflowEventId: row.workflow_event_id,
          attempts: failed.attempts,
          error: message,
        });
        return;
      }

      this.metrics.recordFailed(message);
      console.warn('[workflow-outbox] publish failed; scheduled retry', {
        outboxId: row.id,
        workflowEventId: row.workflow_event_id,
        attempts: failed.attempts,
        nextAttemptAt: failed.next_attempt_at,
        error: message,
      });
    }
  }
}
