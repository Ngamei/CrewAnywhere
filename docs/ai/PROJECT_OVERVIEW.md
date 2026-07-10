# Project Overview — CrewAnywhere

Marketplace and workforce-operations platform (not a simple job board). Business users (employers) and crew users (workers) sit behind `auth_accounts` in separate tables (`business_users`, `crew_users`).

## Canonical lifecycle
Registration -> Profile Creation -> Marketplace Readiness -> Event Creation -> Job Creation -> Proposal Submission -> Hire -> Assignment Creation -> Shift Generation -> Event-Day Execution -> Payment Release -> Withdrawal

## Canonical hierarchy
Event -> Job -> Proposal -> Assignment -> Shift -> Payment

## Separation rules
- Proposal owns the hiring lifecycle only.
- Assignment becomes authoritative after hire, funding, and operational approval.
- Shift owns attendance and event-day execution.
- Payment is operationally validated, not hiring validated.

## Scope
Foundation complete; marketplace/hiring/operations/payment features are to be implemented inside their domain-owned modules (`src/domain/*`, `src/modules/*`). See `NEXT_STEPS.md` and root `CURRENT_STATE.md` / `TASKS.md`.
