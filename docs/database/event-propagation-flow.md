# Event Propagation Flow

End-to-end flow from workflow transition to downstream consumers.

## 1. Transition Command (Transactional)

```mermaid
sequenceDiagram
  participant Service as Backend Service
  participant DB as Postgres
  participant Outbox as workflow_event_outbox

  Service->>DB: transition_workflow_entity(...)
  DB->>DB: lock entity, update status
  DB->>DB: insert workflow_transition_events
  DB->>DB: insert audit_logs
  DB->>Outbox: insert pending outbox row
  DB-->>Service: workflow event + outbox row
```

All writes commit or roll back together. No orphan status changes without events or outbox rows.

## 2. Outbox Claim (Worker)

```mermaid
sequenceDiagram
  participant Worker as Outbox Worker
  participant DB as Postgres

  loop poll interval
    Worker->>DB: claim_workflow_outbox_batch()
    DB->>DB: recover stale processing leases
    DB->>DB: FOR UPDATE SKIP LOCKED (pending/failed)
    DB->>DB: set status = processing
    DB-->>Worker: claimed batch
  end
```

## 3. Publish + Acknowledge

```mermaid
sequenceDiagram
  participant Worker as Outbox Worker
  participant Deduper as Publish Deduper
  participant Dispatcher as Event Dispatcher
  participant Publisher as Topic Publisher
  participant DB as Postgres

  Worker->>Deduper: wasPublished(workflow_event_id)?
  alt already published in-process
    Worker->>DB: complete_workflow_outbox_publish
  else new publish
    Worker->>Dispatcher: dispatch(topic, payload)
    Dispatcher->>Publisher: publish(...)
    Publisher-->>Dispatcher: ok
    Worker->>Deduper: markPublished(workflow_event_id)
    Worker->>DB: complete_workflow_outbox_publish
  end
```

On failure:

```mermaid
sequenceDiagram
  participant Worker as Outbox Worker
  participant DB as Postgres

  Worker->>DB: fail_workflow_outbox_publish(error)
  alt attempts < max
    DB-->>Worker: status failed, next_attempt_at scheduled
  else
    DB-->>Worker: status dead_lettered
  end
```

## Payload Contract

Outbox `payload` is built by `transition_workflow_entity` and includes:

- `workflow_event_id`
- `entity_type`, `entity_id`
- `from_status`, `from_status_version`
- `to_status`, `to_status_version`
- `transition_rule_id`, `transition_rule_version`
- `correlation_id`, `transition_source`, `created_at`

Consumers should treat `workflow_event_id` as the idempotency key for side effects.

## Consumer Guidance

- Subscribe by `topic` (for example `workflow.events` or rule-specific realtime topics).
- Never infer lifecycle truth from outbox delivery alone; read entity status and transition history for authority.
- Design handlers to be idempotent: at-least-once delivery is expected until `published`.
- Keep transition orchestration in services using `transition_workflow_entity`; keep propagation in outbox workers.

## Local Worker Entrypoint

`runWorkflowOutboxWorker()` in `src/backend/workers/run-workflow-outbox-worker.ts` wires the admin Supabase client and logging publisher for development and operational smoke tests.
