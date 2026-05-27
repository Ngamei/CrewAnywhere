import { BaseRepository } from '@/backend/repositories/base-repository';
import type { EntityId } from '@/domain';
import type { WorkflowOutboxRow } from '@/shared/events';
import { OUTBOX_WORKER_DEFAULTS } from './constants';
import type { OutboxRetryPolicy } from './retry-policy';

type ClaimBatchParams = {
  batchSize?: number;
  processingLeaseSeconds?: number;
};

type FailPublishParams = {
  outboxId: EntityId;
  error: string;
  retryPolicy?: OutboxRetryPolicy;
};

export class WorkflowOutboxRepository extends BaseRepository {
  constructor(supabase: BaseRepository['supabase']) {
    super(supabase);
  }

  async claimBatch(params: ClaimBatchParams = {}): Promise<WorkflowOutboxRow[]> {
    const batchSize = params.batchSize ?? OUTBOX_WORKER_DEFAULTS.batchSize;
    const processingLeaseSeconds =
      params.processingLeaseSeconds ?? OUTBOX_WORKER_DEFAULTS.processingLeaseSeconds;

    const { data, error } = await this.supabase.rpc('claim_workflow_outbox_batch', {
      p_batch_size: batchSize,
      p_processing_lease: `${processingLeaseSeconds} seconds`,
    });

    if (error) {
      throw new Error(`claim_workflow_outbox_batch failed: ${error.message}`);
    }

    return (data ?? []) as WorkflowOutboxRow[];
  }

  async completePublish(outboxId: EntityId): Promise<WorkflowOutboxRow> {
    const { data, error } = await this.supabase.rpc('complete_workflow_outbox_publish', {
      p_outbox_id: outboxId,
    });

    if (error) {
      throw new Error(`complete_workflow_outbox_publish failed: ${error.message}`);
    }

    return data as WorkflowOutboxRow;
  }

  async failPublish(params: FailPublishParams): Promise<WorkflowOutboxRow> {
    const retryPolicy = params.retryPolicy;

    const { data, error } = await this.supabase.rpc('fail_workflow_outbox_publish', {
      p_outbox_id: params.outboxId,
      p_error: params.error,
      p_max_attempts: retryPolicy?.maxAttempts ?? OUTBOX_WORKER_DEFAULTS.maxAttempts,
      p_base_backoff_seconds: retryPolicy?.baseBackoffSeconds ?? OUTBOX_WORKER_DEFAULTS.baseBackoffSeconds,
      p_max_backoff_seconds: retryPolicy?.maxBackoffSeconds ?? OUTBOX_WORKER_DEFAULTS.maxBackoffSeconds,
    });

    if (error) {
      throw new Error(`fail_workflow_outbox_publish failed: ${error.message}`);
    }

    return data as WorkflowOutboxRow;
  }
}
