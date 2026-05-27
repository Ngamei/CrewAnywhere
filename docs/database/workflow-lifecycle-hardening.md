# Workflow Lifecycle Hardening

This document defines the database-level integrity strategy for CrewAnywhere2.0's critical workflow chain:

`proposal -> assignment -> shift -> payment -> withdrawal`

The goal is workflow correctness before feature generation.

## 1. Relationship Hardening Strategy

The schema now uses redundant lifecycle ownership columns only where they are needed to prove chain integrity.

Critical ownership columns:

- `proposals`: `job_id`, `event_id`, `company_profile_id`, `crew_user_id`
- `assignments`: `proposal_id`, `job_id`, `event_id`, `company_profile_id`, `crew_user_id`
- `shifts`: `assignment_id`, `event_id`, `job_id`, `company_profile_id`, `crew_user_id`
- `payments`: `assignment_id`, `company_profile_id`, `crew_user_id`
- `withdrawal_requests`: `payment_id`, `company_profile_id`, `crew_user_id`

This prevents a downstream workflow object from pointing at a valid record from the wrong company, event, job, or crew user.

## 2. FK Improvements

Composite foreign keys enforce the chain:

- `proposals(job_id, event_id, company_profile_id)` references `jobs(id, event_id, company_profile_id)`.
- `assignments(proposal_id, job_id, event_id, company_profile_id, crew_user_id)` references `proposals(id, job_id, event_id, company_profile_id, crew_user_id)`.
- `shifts(assignment_id, event_id, job_id, company_profile_id, crew_user_id)` references `assignments(id, event_id, job_id, company_profile_id, crew_user_id)`.
- `payments(assignment_id, company_profile_id, crew_user_id)` references `assignments(id, company_profile_id, crew_user_id)`.
- `withdrawal_requests(payment_id, company_profile_id, crew_user_id)` references `payments(id, company_profile_id, crew_user_id)`.

Supporting unique constraints were added on the referenced composite identities.

## 3. Workflow Guard Architecture

Foreign keys enforce identity consistency. Guard triggers enforce lifecycle eligibility.

Current guard functions:

- `guard_proposal_chain()`: verifies proposal job/event/company consistency and prevents duplicate active proposals for the same job and crew.
- `guard_assignment_chain()`: requires the proposal to be `hired` and match job/event/company/crew ownership before assignment creation.
- `guard_shift_chain()`: requires the assignment to match event/job/company/crew ownership and not be cancelled.
- `guard_payment_chain()`: requires payment to match a non-cancelled assignment.
- `guard_withdrawal_chain()`: requires withdrawal to reference a released payment, stay within the payment amount, and use a payout method owned by the same crew user.

These guards should remain narrow. Full business orchestration should live in backend services.

## 4. Lifecycle Validation Recommendations

Before Step 3, define centralized transition maps for:

- `proposal_status`
- `assignment_status`
- `shift_status`
- `payment_status`
- `withdrawal_status`

Recommended minimum transitions:

- Proposal: `applied -> offer_sent -> offer_accepted -> hired`
- Assignment: `scheduled -> active -> completed`
- Shift: `scheduled -> checked_in -> in_progress -> completed`
- Payment: `pending -> authorized -> funded -> released`
- Withdrawal: `requested -> under_review -> approved -> processing -> paid`

Terminal failure paths should remain explicit:

- Proposal: `declined`, `withdrawn`
- Assignment: `cancelled`
- Shift: `no_show`, `cancelled`
- Payment: `failed`, `cancelled`, `refunded`
- Withdrawal: `rejected`, `cancelled`

## 5. Integrity Enforcement Strategy

Use three enforcement layers:

1. Composite FKs for ownership and chain consistency.
2. Guard triggers for database-level lifecycle prerequisites.
3. Backend service validation for business rules, actor permissions, audit metadata, and multi-step transactions.

The database should reject impossible chains. Services should prevent undesirable but technically possible business actions.

## 6. Service-Level Validation Recommendations

Backend services should validate:

- A proposal can only be hired when the job is still open/reviewing and the crew is marketplace-ready.
- An assignment can only be created inside the same transaction that closes hiring and prepares payment/escrow.
- A shift can only be scheduled within the assignment/event time window.
- Payment funding, release, refund, and withdrawal must be idempotent.
- Withdrawal amount must be reconciled against ledger-backed wallet balance.
- A payment can only have one active withdrawal request; rejected or cancelled withdrawals may be retried.
- Every transition writes a `workflow_transition_events` record and an `audit_logs` record with actor, reason, and metadata.

Services should wrap lifecycle changes in database transactions and use service-role access for workflow writes.

## 7. Synchronization Enforcement Additions

The canonical workflow executor now includes explicit synchronization checks:

- pre-sync assertion: persisted status/version must match latest event status/version
- stale protection: optional expected from-status/version allows optimistic concurrency at command level
- sequence protection: rejects invalid transition sequences when non-initial transitions are attempted but workflow history is missing (and rejects initial transitions when history unexpectedly exists)
- post-sync assertion: persisted status/version must equal inserted workflow event target state
- replay assertion: idempotent retries are rejected if event state and persisted state diverge

This prevents silent event/entity drift and replay inconsistency.

## 8. Operational Reconciliation

Use `public.workflow_transition_drift` as the primary operational check and `public.workflow_transition_invariant_violations` for strict chain-level invariant monitoring.

Recommended runbook:

1. Alert when drift rows are non-zero.
2. Pause affected workflow consumers.
3. Inspect `workflow_transition_events`, `workflow_event_outbox`, and `audit_logs`.
4. Apply compensating transitions only (never mutate historical events).
5. Resume workers after the drift query returns zero rows.

## 9. Lock Ordering Guidance

When a transaction must touch multiple lifecycle entities, enforce lock order:

`proposal -> assignment -> shift -> payment -> withdrawal`

This ordering should be implemented in service-layer orchestration code to minimize deadlock risk.
