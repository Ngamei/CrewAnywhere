# Workflow Outbox Architecture

CrewAnywhere2.0 propagates workflow side effects through a transactional outbox. The database records intent atomically with lifecycle transitions; workers publish asynchronously without breaking orchestration guarantees.

## Components

| Layer | Responsibility |
| --- | --- |
| `transition_workflow_entity(...)` | Inserts immutable `workflow_transition_events` and matching `workflow_event_outbox` rows in the same transaction |
| `workflow_event_outbox` | Durable publish queue keyed by `workflow_event_id` |
| SQL claim functions | Worker-safe batch claiming with `FOR UPDATE SKIP LOCKED` |
| `OutboxWorkerService` | Poll, publish, complete/fail lifecycle updates |
| `WorkflowEventDispatcher` | Topic routing to publisher implementations |
| `WorkflowPublishDeduper` | Process-local replay guard by `workflow_event_id` |

## Status Lifecycle

```txt
pending -> processing -> published
              |
              +-> failed -> (retry) -> processing ...
              |
              +-> dead_lettered (max attempts exceeded)
```

Stale `processing` rows are recovered to `failed` with `next_attempt_at = now()` when their lease expires.

## Concurrency Model

- Multiple workers may poll concurrently.
- `claim_workflow_outbox_batch` selects eligible rows with `FOR UPDATE SKIP LOCKED`, then marks them `processing`.
- Only one worker owns a given row during processing.
- Completion and failure updates are idempotent at the row level (`complete_workflow_outbox_publish` accepts `processing` or already `published`).

## Immutability Guarantees

- Workflow transition events remain append-only.
- Outbox rows reference events through `workflow_event_id` with a unique constraint.
- Publishing never mutates transition history; it only advances outbox delivery state.

## Code Layout

```txt
src/shared/events/                 # shared outbox types and payload contracts
src/backend/services/outbox/       # repository, worker service, publisher, dispatcher
src/backend/workers/               # polling worker loop and ops entrypoint
supabase/migrations/0004_*         # claim/complete/fail SQL functions
```

## Operational Notes

- Run workers with the Supabase service role.
- Pause workers when `workflow_transition_drift` is non-zero.
- Inspect `last_error`, `attempts`, and `next_attempt_at` for failed or dead-lettered rows.
- Replace `LoggingWorkflowEventPublisher` with realtime/webhook publishers without changing claim semantics.
