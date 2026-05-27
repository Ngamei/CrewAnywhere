import { LoggingWorkflowEventPublisher } from '@/backend/services/outbox';
import { createSupabaseAdminClient } from '@/shared/supabase/admin';
import { WorkflowOutboxWorker } from './workflow-outbox-worker';

/**
 * Minimal process entrypoint for local/ops worker execution.
 * Wire into a cron, systemd unit, or platform worker when ready.
 */
export async function runWorkflowOutboxWorker() {
  const supabase = createSupabaseAdminClient();
  const workerId = crypto.randomUUID();

  const worker = new WorkflowOutboxWorker({
    supabase,
    publisher: new LoggingWorkflowEventPublisher({ workerId }),
    onPollResult: (result) => {
      console.info('[workflow-outbox-worker] poll complete', {
        workerId,
        claimed: result.claimed,
        metrics: result.metrics,
      });
    },
  });

  const shutdown = () => worker.stop();
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await worker.start();
}
