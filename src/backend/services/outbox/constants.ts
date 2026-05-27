export const OUTBOX_WORKER_DEFAULTS = {
  batchSize: 50,
  pollIntervalMs: 2_000,
  processingLeaseSeconds: 300,
  maxAttempts: 10,
  baseBackoffSeconds: 5,
  maxBackoffSeconds: 3_600,
} as const;
