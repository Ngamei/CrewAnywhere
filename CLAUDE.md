# Claude / Cursor Instructions — CrewAnywhere

Operate inside CrewAnywhere only. Do not mix other project context.

## Before working
Read, in order:
1. `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md` (project brain — high-level state).
2. `docs/ai/00_AI_INDEX.md` -> the `/docs/ai/` index, which points into the detailed `docs/` (architecture, auth, database, payments).
3. For DB work: `docs/database/architecture.md`.

## What this repo is
- Marketplace + workforce-operations platform. Next.js App Router + TypeScript + Tailwind + Supabase.
- v2.0 foundation complete; most domain features NOT yet built.
- Hierarchy: Event -> Job -> Proposal -> Assignment -> Shift -> Payment.

## Rules
- Never build features outside their domain module (`src/domain`, `src/modules/<domain>`).
- Never bypass the atomic transition engine for state changes.
- Never mix `business_user` and `crew_user` logic; keep the tables separate behind `auth_accounts`.
- All schema changes via Supabase migration files only.
- No cross-domain imports except through the shared layer (`src/backend`, `src/shared`).
- `/docs/ai/` and `docs/*` (implementation truth): may be updated after meaningful changes.
- Brain files (`CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md`): confirm first, then write.

## Flag before doing
- Changes to shared UI primitives or the auth/session layer.
- Schema migrations on existing data.
- New cross-domain dependencies.
