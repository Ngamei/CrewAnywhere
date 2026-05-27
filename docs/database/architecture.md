# CrewAnywhere2.0 Database Architecture

This is the database-first foundation for CrewAnywhere2.0 as a workforce marketplace, operational staffing platform, escrow payment workflow, and event operations management system.

Canonical schema file:

`schema.sql`

Supabase migration entrypoint:

`supabase/migrations/0001_unified_database_architecture.sql`

## Architecture Decision

CrewAnywhere uses separate user tables:

- `business_users`
- `crew_users`

Both attach to `auth_accounts`, which bridges Supabase auth identity to platform identity. Domain tables never point directly at `auth.users`; they point at the appropriate platform user or company table.

## Core Layers

### Auth Layer

- `auth_accounts` central account identity, Supabase `auth.users` bridge, email, provider, account type, account status.
- `email_verifications` verification token records.
- `sessions` platform session metadata for audit and session control.

### Business Domain

- `business_users` business-side user identity.
- `company_profiles` company entity owned by a business user.
- `business_finance_records` billing and tax readiness record.
- `kyb_records` business verification history.

### Crew Domain

- `crew_users` crew-side user identity.
- `crew_profiles` public/private crew profile and marketplace readiness.
- `crew_skills` normalized crew skills.
- `crew_experience` normalized work history.
- `crew_finance_records` tax and finance readiness.
- `crew_wallets` wallet metadata; balances are derived from the immutable ledger.
- `kyc_records` crew identity verification history.

### Marketplace Domain

- `events` macro operational container owned by a company.
- `jobs` staffing requirements under events.
- `job_skills` normalized job skill requirements.
- `saved_jobs` crew saved-job list.
- `proposals` proposal-centric hiring lifecycle.
- `proposal_terms` rate and negotiated terms.
- `proposal_attachments` file references for proposal documents.

### Operations Domain

- `assignments` authoritative workforce engagement after hire.
- `shifts` attendance and event-day execution records.
- `attendance_verifications` QR/GPS/supervisor/manual verification records.
- `operational_incidents` operational issue tracking.

### Payment Domain

- `payments` assignment-linked payment intent and lifecycle.
- `escrow_records` escrow funding, holding, release, refund, dispute state.
- `refunds` refund workflow records.
- `withdrawal_requests` crew withdrawal lifecycle.
- `payout_methods` crew payout destinations.
- `finance_transactions` immutable append-only ledger and financial source of truth.
- `crew_wallet_balances` derived wallet balance view.

## Relationship Explanation

The schema intentionally flows in one direction to avoid circular dependencies:

`auth_accounts -> business_users -> company_profiles -> events -> jobs -> proposals -> assignments -> shifts -> payments`

Crew participates from the side:

`auth_accounts -> crew_users -> crew_profiles / crew_skills / proposals / assignments / shifts / wallets`

Payment records reference operational outcomes, but operational tables do not reference payment tables. This preserves the rule that payment release is operationally validated, not hiring validated.

Proposal remains the hiring object. Assignment becomes authoritative after hire. Shift owns attendance execution.

Workflow hardening now enforces the operational chain with composite foreign keys and guard triggers:

`proposal -> assignment -> shift -> payment -> withdrawal`

See `docs/database/workflow-lifecycle-hardening.md`.

Central workflow state machines are defined in `workflow_transition_rules` and recorded immutably in `workflow_transition_events`.

See `docs/database/workflow-transition-system.md`.

Atomic workflow execution is handled through `transition_workflow_entity(...)`.

See `docs/database/atomic-transition-engine.md`.

Status/event synchronization is enforced with status versions and executor-only status updates.

See `docs/database/status-event-synchronization.md`.

Financial accounting is ledger-first. `finance_transactions` owns money movement, while wallet balances are computed state.

See `docs/database/financial-ledger-architecture.md`.

## Cascading Strategy

- Auth support records such as `email_verifications` and `sessions` cascade from `auth_accounts`.
- Ephemeral child records such as `job_skills`, `saved_jobs`, `proposal_terms`, `proposal_attachments`, and `attendance_verifications` cascade from their parent.
- Operational and financial history uses `on delete restrict` or `on delete set null` to preserve auditability.
- User and transactional records use soft delete through `deleted_at`; hard deletes should be rare and service-role controlled.

## Indexing Strategy

The schema includes:

- Partial unique indexes that ignore soft-deleted rows, such as active account email, saved jobs, and proposal uniqueness.
- Foreign-key lookup indexes on all high-traffic relationships.
- Status indexes for operational dashboards and lifecycle views.
- Schedule indexes for events and shifts.
- Crew and business owner indexes for RLS and API filtering.
- JSONB GIN indexes for verification metadata and finance transaction metadata.
- Audit indexes by entity and domain.
- Chain indexes for proposal, assignment, shift, payment, withdrawal, and workflow audit lookups.
- Ledger indexes for idempotency, ledger groups, ledger accounts, withdrawals, refunds, and crew financial history.

Indexes are intentionally scoped with `where deleted_at is null` where records are soft-deletable.

## Supabase RLS Recommendations

Baseline RLS is enabled on all tables in `schema.sql`.

Recommended policy model:

- Public clients should read/write only through policies tied to `current_auth_account_id()`, `current_business_user_id()`, and `current_crew_user_id()`.
- Transactional writes for hiring, assignment, attendance, escrow, refunds, withdrawals, and finance transactions should go through backend service-role functions or server route handlers.
- Crew users can read their own profile, proposals, assignments, shifts, payments, wallets, payout methods, and withdrawals.
- Business users can read company-owned events, jobs, proposals, assignments, shifts, payments, KYB, and finance records.
- Marketplace read policies can expose only open/reviewing jobs and published marketplace-ready crew profiles.
- Audit logs should be service-role write-only, with restricted admin read policies later.
- Workflow writes should remain service-role controlled. Public clients should not directly write `assignments`, `payments`, `withdrawal_requests`, `workflow_transition_events`, or financial tables.
- Browser clients must not directly write `finance_transactions`; all ledger writes should be service-role controlled and idempotent.

## ERD Explanation

High-level ERD:

```txt
auth_accounts
  |-- email_verifications
  |-- sessions
  |-- business_users
  |     |-- company_profiles
  |           |-- business_finance_records
  |           |-- kyb_records
  |           |-- events
  |                 |-- jobs
  |                       |-- job_skills
  |                       |-- proposals
  |                             |-- proposal_terms
  |                             |-- proposal_attachments
  |                             |-- assignments
  |                                   |-- shifts
  |                                         |-- attendance_verifications
  |                                         |-- operational_incidents
  |                                   |-- payments
  |                                         |-- escrow_records
  |                                         |-- refunds
  |                                         |-- withdrawal_requests
  |                                         |-- finance_transactions
  |                                   |-- workflow_transition_events
  |
  |-- crew_users
        |-- crew_profiles
        |-- crew_skills
        |-- crew_experience
        |-- crew_finance_records
        |-- crew_wallets
        |-- crew_wallet_balances
        |-- kyc_records
        |-- saved_jobs
        |-- proposals
        |-- assignments
        |-- shifts
        |-- payout_methods
        |-- withdrawal_requests
```

This ERD keeps business ownership, crew identity, marketplace hiring, operational execution, and finance records separate while preserving traceability across the full lifecycle.
