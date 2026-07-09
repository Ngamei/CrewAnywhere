# Project Overview — CrewAnywhere

## What it is
CrewAnywhere2.0 is a hiring and workforce-operations marketplace (not a simple job board). Businesses create events and jobs; crew apply via proposals; hired crew become assignments with shifts; work is paid through an escrow-backed financial ledger. Built as a modular monolith on Next.js App Router + TypeScript + Tailwind, backed by Supabase (Postgres, Auth, Realtime).

## Canonical lifecycle
`Registration -> Profile Creation -> Marketplace Readiness -> Event Creation -> Job Creation -> Proposal Submission -> Hire -> Assignment Creation -> Shift Generation -> Event-Day Execution -> Payment Release -> Withdrawal`

## Canonical operational hierarchy
`Event -> Job -> Proposal -> Assignment -> Shift -> Payment`

Core separation rules (see `docs/architecture/domain-boundaries.md`):
- Proposal owns the hiring lifecycle only.
- Assignment becomes authoritative after hire, funding, and operational approval.
- Shift owns attendance and event-day execution.
- Payment is operationally validated, not hiring validated.

## Users
- **Business users** (employers) — attach to `auth_accounts`, own `company_profiles`, create events/jobs.
- **Crew users** (workers) — attach to `auth_accounts`, own `crew_profiles`, submit proposals, work shifts, withdraw earnings.
- Business and crew identity/logic are kept strictly separate.

## What it is NOT (current scope)
The foundation is complete; the domain **features** are not built yet. The repo ships structure, shared primitives, the database schema, auth/session foundation, the atomic transition engine, and operational UI shells. Marketplace, hiring, operations, and payment features are to be implemented inside their domain modules. See root `CURRENT_STATE.md`.
