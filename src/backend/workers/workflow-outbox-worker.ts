import { OutboxWorkerService, type OutboxWorkerServiceOptions } from '@/backend/services/outbox';
import { OUTBOX_WORKER_DEFAULTS } from '@/backend/services/outbox/constants';

export type WorkflowOutboxWorkerOptions = OutboxWorkerServiceOptions & {
  pollIntervalMs?: number;
  signal?: AbortSignal;
  onPollResult?: (result: Awaited<ReturnType<OutboxWorkerService['processOnce']>>) => void;
};

export class WorkflowOutboxWorker {
  private running = false;
  private readonly service: OutboxWorkerService;
  private readonly pollIntervalMs: number;

  constructor(private readonly options: WorkflowOutboxWorkerOptions) {
    this.service = new OutboxWorkerService(options);
    this.pollIntervalMs = options.pollIntervalMs ?? OUTBOX_WORKER_DEFAULTS.pollIntervalMs;
  }

  getMetrics() {
    return this.service.getMetrics();
  }

  async processOnce() {
    const result = await this.service.processOnce();
    this.options.onPollResult?.(result);
    return result;
  }

  async start() {
    if (this.running) {
      return;
    }

    this.running = true;

    while (this.running && !this.options.signal?.aborted) {
      await this.processOnce();
      await sleep(this.pollIntervalMs, this.options.signal);
    }
  }

  stop() {
    this.running = false;
  }
}

function sleep(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
