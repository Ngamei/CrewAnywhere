# CrewAnywhere2.0 Technical Foundation

This repository starts as a modular Next.js App Router application with Supabase-backed auth and persistence.

The foundation is intentionally feature-light. It defines the structure that future marketplace, hiring, operations, and payment features must use.

## Canonical Platform Model

CrewAnywhere2.0 is a marketplace and workforce operations platform, not a simple job board.

Canonical lifecycle:

`Registration -> Profile Creation -> Marketplace Readiness -> Event Creation -> Job Creation -> Proposal Submission -> Hire -> Assignment Creation -> Shift Generation -> Event-Day Execution -> Payment Release -> Withdrawal`

Canonical operational hierarchy:

`Event -> Job -> Proposal -> Assignment -> Shift -> Payment`

Core separation rules:

- Proposal owns hiring lifecycle only.
- Assignment becomes authoritative after hire, funding, and operational approval.
- Shift owns attendance and event-day execution.
- Payment is operationally validated, not hiring validated.
- Compliance, audit, and security are platform-level concerns.

## Architecture Style

Use a modular monolith first:

- Domain boundaries are explicit in `src/domain`.
- Backend use cases live in `src/modules/<domain>/server`.
- Shared backend primitives live in `src/backend`.
- API routes expose versioned contracts under `src/app/api/v1`.
- Supabase schemas are separated by table ownership and service responsibility.

Future service extraction should follow the same boundaries rather than split by page or UI flow.
