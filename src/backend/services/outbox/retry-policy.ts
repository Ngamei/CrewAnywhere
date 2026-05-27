import { OUTBOX_WORKER_DEFAULTS } from './constants';

export type OutboxRetryPolicy = {
  maxAttempts: number;
  baseBackoffSeconds: number;
  maxBackoffSeconds: number;
};

export function createDefaultOutboxRetryPolicy(
  overrides: Partial<OutboxRetryPolicy> = {},
): OutboxRetryPolicy {
  return {
    maxAttempts: overrides.maxAttempts ?? OUTBOX_WORKER_DEFAULTS.maxAttempts,
    baseBackoffSeconds: overrides.baseBackoffSeconds ?? OUTBOX_WORKER_DEFAULTS.baseBackoffSeconds,
    maxBackoffSeconds: overrides.maxBackoffSeconds ?? OUTBOX_WORKER_DEFAULTS.maxBackoffSeconds,
  };
}

export function computeBackoffSeconds(attemptsAfterFailure: number, policy: OutboxRetryPolicy) {
  const exponent = Math.max(attemptsAfterFailure - 1, 0);
  const rawBackoff = policy.baseBackoffSeconds * 2 ** exponent;
  return Math.min(policy.maxBackoffSeconds, rawBackoff);
}
