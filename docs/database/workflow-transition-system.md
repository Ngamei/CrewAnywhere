# Centralized Workflow Transition System

CrewAnywhere2.0 uses centralized workflow rules and immutable transition history for lifecycle orchestration.

Supported workflow domains:

- proposal lifecycle
- assignment lifecycle
- shift lifecycle
- payment lifecycle
- withdrawal lifecycle
- KYB lifecycle
- KYC lifecycle

## 1. `workflow_transition_events` Architecture

`workflow_transition_events` is immutable transition history.

Required fields:

- `workflow_event_id`: UUID primary key.
- `transition_rule_id`: immutable reference to the rule used.
- `transition_rule_version`: immutable rule version at execution time.
- `entity_type`: workflow entity type, such as `proposal`, `assignment`, `shift`, `payment`, `withdrawal`, `kyb`, or `kyc`.
- `entity_id`: UUID of the transitioned entity.
- `from_status`: status before transition; nullable for creation events.
- `from_status_version`: status version before transition; nullable for creation events.
- `to_status`: status after transition.
- `to_status_version`: status version after transition.
- `transition_reason`: human or system reason.
- `transitioned_by`: actor account, nullable for provider/system events.
- `transition_source`: `system`, `business_user`, `crew_user`, `admin`, `provider_webhook`, or `scheduled_job`.
- `idempotency_key`: unique retry-safe command key.
- `correlation_id`: cross-service operation trace ID.
- `realtime_topic`: publication route copied from the transition rule.
- `guard_result`: JSONB result of evaluated guards.
- `metadata`: JSONB operational context for debugging and replay.
- `created_at`: immutable event timestamp.

Enforcement:

- update/delete blocked by trigger
- transition must exist in `workflow_transition_rules`
- entity must exist for the declared `entity_type`
- self-transitions are rejected
- event target status/version must match the persisted entity status/version
- status updates outside `transition_workflow_entity(...)` are rejected

## 2. Transition Rule Architecture

`workflow_transition_rules` is the central transition map. Application services and database guards should read this table instead of duplicating lifecycle logic.

Rule fields:

- `entity_type`
- `from_status`
- `to_status`
- `transition_name`
- `guard_keys`
- `requires_service_role`
- `is_terminal`
- `realtime_topic`
- `sort_order`
- `active`
- `created_at`

Centralized maps are seeded for:

### Proposal

- `null -> applied`
- `applied -> offer_sent`
- `applied -> declined`
- `applied -> withdrawn`
- `offer_sent -> offer_accepted`
- `offer_sent -> declined`
- `offer_sent -> withdrawn`
- `offer_accepted -> hired`
- `offer_accepted -> withdrawn`

### Assignment

- `null -> scheduled`
- `scheduled -> active`
- `scheduled -> cancelled`
- `active -> completed`
- `active -> cancelled`

### Shift

- `null -> scheduled`
- `scheduled -> checked_in`
- `scheduled -> no_show`
- `scheduled -> cancelled`
- `checked_in -> in_progress`
- `checked_in -> cancelled`
- `in_progress -> completed`
- `in_progress -> cancelled`

### Payment

- `null -> pending`
- `pending -> authorized`
- `pending -> failed`
- `pending -> cancelled`
- `authorized -> funded`
- `authorized -> failed`
- `authorized -> cancelled`
- `funded -> released`
- `funded -> refunded`
- `released -> refunded`

### Withdrawal

- `null -> requested`
- `requested -> under_review`
- `requested -> approved`
- `requested -> rejected`
- `requested -> cancelled`
- `under_review -> approved`
- `under_review -> rejected`
- `under_review -> cancelled`
- `approved -> processing`
- `approved -> rejected`
- `approved -> cancelled`
- `processing -> paid`
- `processing -> rejected`

### KYB / KYC

Both use the shared verification lifecycle:

- `null -> pending`
- `pending -> submitted`
- `pending -> expired`
- `submitted -> approved`
- `submitted -> additional_info_requested`
- `submitted -> rejected`
- `submitted -> expired`
- `approved -> revoked`
- `additional_info_requested -> submitted`
- `rejected -> submitted`

## 3. Workflow Guard Architecture

### DB Integrity Guards

Database guards enforce impossible-state prevention:

- composite FK chain integrity
- entity existence for transition events
- allowed transition rule existence
- immutable transition history
- immutable financial ledger entries

These guards should stay narrow and deterministic.

### Service-Layer Business Guards

Services evaluate business readiness:

- actor permissions
- job/event status eligibility
- crew marketplace readiness
- payment authorization and escrow state
- wallet balance derived from ledger
- KYC/KYB provider result validity
- idempotency and retry behavior

### Workflow Orchestration Guards

The orchestrator evaluates `guard_keys` from `workflow_transition_rules`.

Each guard should return:

- `passed`
- `guard_key`
- `message`
- `context`

The combined result is stored in `workflow_transition_events.guard_result`.

## 4. Synchronization Invariants

`workflow_transition_events` and persisted entity status must remain synchronized at all times.

### Pre-transition invariants

- current persisted status/version must match latest event `to_status`/`to_status_version`
- optional optimistic concurrency claims (`input_expected_from_status`, `input_expected_from_status_version`) must match persisted state
- stale/replayed commands are rejected before status mutation

### Post-transition invariants

- persisted status/version must equal inserted event `to_status`/`to_status_version`
- idempotent retries must resolve to the same event and same persisted status/version
- any replay drift raises an exception

Helper functions:

- `public.read_workflow_entity_state(...)`
- `public.assert_workflow_transition_pre_sync(...)`
- `public.assert_workflow_transition_post_sync(...)`

## 5. Workflow Orchestration Recommendations

Transitions should occur in backend service-layer commands or Postgres RPC functions, not directly from frontend clients.

The canonical executor is:

```sql
public.transition_workflow_entity(...)
```

See `docs/database/atomic-transition-engine.md`.

Recommended command flow:

1. Service evaluates business guards from `guard_keys`.
2. Service calls `transition_workflow_entity(...)` with guard result, idempotency key, and correlation ID.
3. RPC locks the entity row with `SELECT ... FOR UPDATE`.
4. RPC validates pre-sync invariants against latest event history and optional optimistic concurrency expectations.
5. RPC validates transition rule, updates entity status, inserts `workflow_transition_events`, inserts `audit_logs`, inserts `workflow_event_outbox`, verifies post-sync invariants, and commits atomically.
6. Async workers publish outbox rows after commit.

Realtime compatibility:

- subscribe to `workflow_transition_events`
- use `entity_type`, `entity_id`, and `realtime_topic` for routing
- never infer workflow completion from status updates alone
- use `workflow_event_outbox` for reliable worker/realtime publication

Audit/replay compatibility:

- replay transition history by `entity_type`, `entity_id`, `created_at`
- inspect `guard_result` for debugging
- use `transition_source` and `transitioned_by` to distinguish user, provider, system, and admin actions
- use `transition_rule_id`, `transition_rule_version`, `idempotency_key`, and `correlation_id` for deterministic replay

## 6. Idempotency and Replay Safety

`idempotency_key` remains globally unique.

- identical retries return the existing event only when entity and target state are still synchronized
- idempotency collisions for different transition intents are rejected
- replayed commands with drifted persisted state are rejected with explicit synchronization errors

`correlation_id` should represent an end-to-end business operation:

- provider webhook retries reuse both `idempotency_key` and `correlation_id`
- async workers may retry safely with the same keys
- service orchestration should generate deterministic idempotency keys per transition intent

## 7. Drift Detection and Recovery

Operational drift query:

- `public.workflow_transition_drift`

The view reports entities where:

- no workflow event exists for an active entity, or
- persisted status/version differs from latest workflow event status/version

Recovery policy:

1. Freeze affected orchestration path.
2. Inspect latest workflow event + audit trail + provider references.
3. Apply compensating transition (never mutate historical events).
4. Record operator reason in `transition_reason` and `metadata`.
5. Resume async processing after drift is cleared.

## 8. Locking and Concurrency

`transition_workflow_entity(...)` locks only the target row (`SELECT ... FOR UPDATE`).

For multi-entity commands in service layer transactions, keep lock order stable to avoid deadlocks:

- proposal
- assignment
- shift
- payment
- withdrawal

When a command spans multiple entities, acquire locks in this order before issuing transitions.

## 9. Lifecycle Validation Helpers

Reusable validation pattern:

```txt
validateTransition(entityType, entityId, fromStatus, toStatus, actor, source)
  -> load rule
  -> evaluate guard_keys
  -> return guard_result
```

Database helper:

```sql
public.is_workflow_transition_allowed(entity_type, from_status, to_status)
```

Services should call this helper or query `workflow_transition_rules` directly before updating entity status.

Invalid transition prevention:

- reject when no active rule exists
- reject when current entity status does not match `from_status`
- reject when guard result has failed checks
- reject direct browser writes for service-role transitions
- reject retries without idempotency key where the transition causes side effects

Rollback/recovery:

- do not update old transition events
- add a compensating transition where allowed
- add ledger reversal entries for financial recovery
- store provider replay IDs and job IDs in `metadata`
- record admin recovery reason in `transition_reason`

## 10. Synchronization Flow Diagrams (Text)

### Canonical transition execution

`command -> guard evaluation -> transition_workflow_entity -> lock entity -> pre-sync check -> rule validation -> status update -> event insert -> outbox insert -> post-sync check -> commit`

### Idempotent retry path

`retry command (same idempotency_key) -> load existing event -> verify persisted status/version == event to_status/version -> return existing event`

### Drift recovery path

`drift detection view hit -> inspect event/audit/provider metadata -> execute compensating transition -> verify view clear`

## 11. Production Notes

Avoid duplicated lifecycle logic by treating `workflow_transition_rules` as the canonical source.

Application code may define typed constants generated from this table later, but the database remains the canonical transition authority.

For multi-agent development, each domain service should own only its guard implementations. No service should hardcode the entire lifecycle map.
