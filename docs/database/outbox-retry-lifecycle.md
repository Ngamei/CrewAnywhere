# Outbox Retry Lifecycle

This document describes how failed workflow outbox publishes are retried and when rows are dead-lettered.

## Attempt Accounting

Each publish failure calls `fail_workflow_outbox_publish`, which:

1. Locks the outbox row (`FOR UPDATE`).
2. Increments `attempts` by one.
3. Stores a trimmed `last_error` (max 2000 characters).
4. Either schedules a retry or marks the row `dead_lettered`.

Default thresholds (TypeScript `OUTBOX_WORKER_DEFAULTS`):

| Setting | Default |
| --- | --- |
| `maxAttempts` | 10 |
| `baseBackoffSeconds` | 5 |
| `maxBackoffSeconds` | 3600 (1 hour) |

## Exponential Backoff

For non-terminal failures:

```txt
backoff_seconds = min(max_backoff_seconds, base_backoff_seconds * 2^(attempts - 1))
next_attempt_at = now() + backoff_seconds
status = failed
```

Example schedule with defaults:

| Attempt after failure | Backoff |
| --- | --- |
| 1 | 5s |
| 2 | 10s |
| 3 | 20s |
| 4 | 40s |
| ... | capped at 3600s |

Rows are claimable when `status in ('pending', 'failed')` and `next_attempt_at <= now()`.

## Dead Lettering

When `attempts >= max_attempts` after a failure:

- `status` becomes `dead_lettered`
- `next_attempt_at` is set to `now()` for operational visibility
- the row is no longer claimed by the worker

Dead-lettered rows require manual reconciliation. Do not mutate historical workflow events; append compensating transitions through the canonical executor when lifecycle correction is required.

## Stale Processing Recovery

If a worker crashes after claiming a row, it may remain `processing`. Before each claim batch, `recover_stale_workflow_outbox_processing` moves rows back to `failed` when:

```txt
status = processing
updated_at < now() - processing_lease
```

Default processing lease: 5 minutes.

## Replay Safety

- Duplicate publish attempts for the same `workflow_event_id` are suppressed in-process by `WorkflowPublishDeduper`.
- Database uniqueness on `workflow_event_id` prevents duplicate outbox inserts during transition replay.
- `complete_workflow_outbox_publish` is safe to call when a row is already `published`.

## Metrics

`OutboxWorkerMetrics` tracks polls, claimed rows, published, deduped, failed, dead-lettered, and the last error for lightweight operational logging.
