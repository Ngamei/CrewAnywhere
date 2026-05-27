# Status/Event Synchronization

CrewAnywhere2.0 enforces strict synchronization between persisted entity status and immutable workflow transition history.

The authoritative execution path is:

`transition_workflow_entity(...)`

## 1. Synchronization Enforcement Architecture

Every workflow-owned entity has:

- `status`
- `status_version`

Workflow-owned entities:

- `proposals`
- `assignments`
- `shifts`
- `payments`
- `withdrawal_requests`
- `kyb_records`
- `kyc_records`

Every `workflow_transition_events` row stores:

- `from_status`
- `from_status_version`
- `to_status`
- `to_status_version`

Status changes are blocked unless they occur inside the canonical executor. This prevents direct service-role updates from silently drifting away from workflow history.

The executor also requires an explicit idempotency key. It will not derive a weak default key because repeated lifecycle targets can occur over a long-running entity history.

## 2. Validation Flow

### Pre-Transition Validation

The executor:

1. resolves idempotency key
2. returns existing event if the key was already processed
3. locks the entity with `SELECT ... FOR UPDATE`
4. reads current `status` and `status_version`
5. loads the active transition rule
6. verifies `rule.from_status = current status`
7. verifies service-evaluated guards passed

### Status Update

The status update trigger:

- rejects status changes outside `transition_workflow_entity(...)`
- increments `status_version` by exactly one when status changes
- rejects direct `status_version` edits without a status transition

### Post-Transition Verification

The workflow event insert trigger verifies:

- event transition matches an active rule
- entity exists
- entity persisted `status = event.to_status`
- entity persisted `status_version = event.to_status_version`
- initial event has `from_status is null`, `from_status_version is null`, and `to_status_version = 0`
- non-initial event has `from_status_version = latest prior to_status_version`
- non-initial event has `to_status_version = from_status_version + 1`

### Rollback Behavior

If validation fails at any step:

- entity status update rolls back
- workflow event insert rolls back
- audit log insert rolls back
- outbox insert rolls back

## 3. Stale Transition Protection Strategy

Stale transition execution is prevented by:

- row-level lock on the target entity
- transition rule matching against locked current status
- status version increment inside the same transaction
- unique `(entity_type, entity_id, to_status_version)` event index
- idempotency key uniqueness
- required explicit idempotency keys for every transition command

A stale worker that expected an older status cannot transition the row after another worker already moved it.

## 4. Optimistic Concurrency Recommendations

Services should pass expected status/version in `input_metadata` for debugging:

```json
{
  "expectedStatus": "authorized",
  "expectedStatusVersion": 2
}
```

The database still uses pessimistic row locking for correctness. Optimistic metadata is for clearer failure messages, observability, and client retry decisions.

## 5. Synchronization Invariants

Required invariants:

- Entity `status` is current lifecycle truth.
- `workflow_transition_events` is immutable lifecycle history.
- Latest workflow event `to_status` must equal entity `status`.
- Latest workflow event `to_status_version` must equal entity `status_version`.
- Status version starts at `0`.
- Every non-initial transition increments status version by exactly `1`.
- No status change can happen outside the executor.
- No event can be inserted unless the entity is already at the event target status/version.

## 6. Replay / Idempotency Synchronization Guarantees

Replay flow:

1. Load transition events by `entity_type`, `entity_id`, `to_status_version`.
2. Verify versions are contiguous.
3. Use final event as expected entity state.
4. Compare final event `to_status/to_status_version` to entity `status/status_version`.

Idempotent retries:

- same idempotency key returns existing event
- duplicate status execution is not performed
- idempotency key reuse against a different entity or target status is treated as a collision
- duplicate outbox rows are prevented by `workflow_event_outbox.workflow_event_id` uniqueness

## 7. Drift Detection Strategy

Recommended drift detection query pattern:

```sql
-- Run per entity table with the matching entity_type.
select entity.id
from public.proposals entity
left join lateral (
  select e.to_status, e.to_status_version
  from public.workflow_transition_events e
  where e.entity_type = 'proposal'
    and e.entity_id = entity.id
  order by e.to_status_version desc
  limit 1
) latest on true
where entity.deleted_at is null
  and (
    latest.to_status is distinct from entity.status::text
    or latest.to_status_version is distinct from entity.status_version
  );
```

Run equivalent checks for assignment, shift, payment, withdrawal, KYB, and KYC.

Operational views:

- `public.workflow_transition_drift`: latest event vs persisted status/version mismatch by entity.
- `public.workflow_transition_invariant_violations`: invariant-level violations:
  - `missing_initial_event` (status_version > 0 but no transition history)
  - `event_version_gap` (non-contiguous `to_status_version`)
  - `orphan_event` (event exists for deleted/missing entity)

## 8. Recovery / Reconciliation Recommendations

If drift is detected:

- stop workers for the affected entity
- identify whether entity status or event history is authoritative
- prefer appending a compensating transition through the executor
- do not mutate old transition events
- only use admin repair scripts with explicit audit logs
- reconcile financial impact through ledger reversal/reconciliation entries

For missing initial events on legacy data:

- run a one-time migration that inserts initial transition events with `to_status_version = 0`
- do not manually set status versions above zero without matching events

## 9. Service-Layer Orchestration Recommendations

Services must:

- call `transition_workflow_entity(...)` for all workflow status changes
- never update status columns directly
- pass idempotency keys for all retries, webhooks, and scheduled workers
- pass correlation IDs across multi-step workflows
- evaluate guard keys before calling the executor
- record provider request IDs and worker job IDs in metadata

## 10. Supabase/Postgres Implementation Strategy

Database implementation:

- `guard_workflow_status_update()` blocks direct status mutations.
- `transition_workflow_entity(...)` sets a local executor flag before status update.
- `workflow_transition_events` stores from/to status versions.
- `guard_workflow_transition_event_insert()` validates persisted entity state against event target state.
- unique event version index prevents duplicate lifecycle version records.

Supabase strategy:

- expose workflow transitions only through service-role route handlers or server actions
- keep browser clients read-only for workflow history
- publish realtime updates from `workflow_event_outbox`, not from direct table updates
- use outbox retries independently from transition retries
