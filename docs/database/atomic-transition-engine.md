# Canonical Atomic Transition Engine

CrewAnywhere2.0 uses `public.transition_workflow_entity(...)` as the canonical workflow execution contract.

The function is designed for backend service-role usage. Browser clients should never call it directly.

## 1. Orchestration Execution Architecture

The transition executor performs the core atomic workflow unit:

1. Resolve idempotency and correlation IDs.
2. Require an explicit idempotency key and return the previous transition event if the key was already processed for the same entity/target.
3. Lock the target entity row with `SELECT ... FOR UPDATE`.
4. Read the current persisted status and status version.
5. Load the active transition rule from `workflow_transition_rules`.
6. Validate the transition from current status to target status.
7. Require service-evaluated guards to pass.
8. Update the entity status and increment status version.
9. Insert immutable `workflow_transition_events` with from/to status versions.
10. Insert `audit_logs`.
11. Insert `workflow_event_outbox`.
12. Commit atomically.

The function returns the inserted or idempotently replayed `workflow_transition_events` row.

## 2. Transaction Boundary Strategy

The database transaction boundary is the workflow transition.

Inside one transaction:

- entity status update
- transition event insert
- audit log insert
- outbox insert

If any step fails, the entire transition rolls back.

Service-layer code should evaluate business guards before calling the executor, then pass the result through `guard_result`.

## 3. Lock Ordering Strategy

For single-entity transitions, the executor locks only the target entity row.

For multi-entity orchestration, services must acquire locks in canonical order before calling transition commands:

`proposal -> assignment -> shift -> payment -> withdrawal`

Verification workflows are independent:

`kyb`

`kyc`

Financial ledger writes should occur inside the same service transaction when the workflow transition depends on money movement.

## 4. Deadlock Prevention Strategy

Rules:

- Always lock parent lifecycle records before child lifecycle records.
- Never lock payment before assignment.
- Never lock withdrawal before payment.
- Keep transactions short.
- Do not call external providers while holding database locks.
- Provider/webhook results should be persisted first, then processed by a short transition transaction.

For async workers:

- claim jobs with `FOR UPDATE SKIP LOCKED`
- call the transition executor after claim
- retry only with the same idempotency key

## 5. Idempotency Architecture

`workflow_transition_events.idempotency_key` is unique.

On duplicate idempotency key, `transition_workflow_entity(...)` returns the existing event instead of executing again.

If the same idempotency key is reused for a different entity or target status, the executor rejects it as an idempotency collision.

Recommended idempotency key format:

```txt
<source>:<entity_type>:<entity_id>:<transition_name>:<external_event_id>
```

Examples:

```txt
stripe:payment:uuid:fund_escrow:evt_123
worker:shift:uuid:mark_no_show:2026-05-26T09
api:proposal:uuid:send_offer:request_uuid
```

## 6. Correlation / Replay Architecture

`correlation_id` groups related workflow activity across services.

Use one correlation ID for a multi-step operation such as:

`proposal hired -> assignment scheduled -> payment pending`

Replay/debug path:

1. Query `workflow_transition_events` by `correlation_id`.
2. Inspect `transition_rule_id` and `transition_rule_version`.
3. Inspect `guard_result`.
4. Inspect `audit_logs`.
5. Inspect `workflow_event_outbox` publication status.

Events store the rule ID and rule version so future rule edits do not rewrite historical meaning.

## 7. Retry Safety Recommendations

Retries must:

- use the same idempotency key
- never directly update entity status outside the executor
- treat returned existing event as success if it matches expected entity and target status
- retry outbox publication independently from workflow transition execution
- use provider event IDs for webhook idempotency

Do not retry by inserting another transition event manually.

## 8. Failure Recovery Strategy

Failure before commit:

- no status change
- no transition event
- no audit log
- no outbox event

Failure after commit but before publication:

- outbox row remains `pending`
- worker retries publication

Incorrect transition:

- append a compensating workflow transition when allowed
- append ledger reversal/reconciliation entries for financial impact
- never update/delete old transition events

Provider mismatch:

- store provider state in metadata
- route to manual/admin recovery workflow
- keep original transition immutable

## 9. Service-Layer Orchestration Recommendations

Services own business guards. The database owns integrity.

Service responsibilities:

- authorization
- actor role checks
- business preconditions
- external provider validation
- guard evaluation
- ledger group creation
- provider idempotency
- outbox worker behavior

Database responsibilities:

- entity row locks
- current status validation
- status/event version synchronization
- transition rule validation
- status update + transition event + audit + outbox atomicity
- immutable history
- FK and chain integrity

## 10. Supabase/Postgres Implementation Strategy

`transition_workflow_entity(...)` is `security definer` and revoked from `anon` and `authenticated`.

Backend service-role code should call it through Supabase RPC.

Suggested call shape:

```ts
await supabase.rpc('transition_workflow_entity', {
  input_entity_type: 'proposal',
  input_entity_id: proposalId,
  input_to_status: 'offer_sent',
  input_transition_reason: 'Business sent offer',
  input_transitioned_by: actorAccountId,
  input_transition_source: 'business_user',
  input_guard_result: { passed: true, checks: [...] },
  input_metadata: { requestId, userAgent },
  input_idempotency_key: idempotencyKey,
  input_correlation_id: correlationId,
});
```

Outbox workers should read `workflow_event_outbox` where `status in ('pending', 'failed')`, publish to Supabase Realtime or a queue, then mark rows `published`.

This keeps the transition transaction small and event-driven compatible.
