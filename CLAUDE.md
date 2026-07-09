# Claude / Cursor Instructions — CrewAnywhere

Operate inside **CrewAnywhere** only. Do not mix in any other project's context.

## Before working
Read, in order:
1. `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md` (project brain — high-level state).
2. `docs/ai/00_AI_INDEX.md` -> the `/docs/ai/` files (implementation truth: what the code is, how it's structured, where the deep docs live).
3. For DB work: `docs/database/architecture.md` (and the rest of `docs/database/`).

## What this repo is
- Hiring and workforce-operations marketplace. Next.js App Router + TypeScript + Tailwind + Supabase (Postgres).
- Foundation is complete; domain features (marketplace, hiring, operations, payments) are **not** yet built.
- All state changes flow through the atomic transition engine (`transition_workflow_entity(...)`).

## Rules
- Never build features outside their domain module (`src/modules/<domain>/`).
- Never bypass the atomic transition engine for state changes.
- Never mix `business_user` and `crew_user` logic.
- Schema changes go in Supabase migration files only (`supabase/migrations/`).
- `/docs/ai/` (implementation truth): may be updated after meaningful changes.
- Brain files (`CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md`): confirm first, then write.
- Keep changes minimal and scoped; do not rewrite unrelated files.

## Flag before changing
- Shared UI primitives (`src/shared/ui/`) or other shared primitives.
- Auth / session layer (`src/shared/auth/`, `src/backend/auth/`, `middleware/`).
- Schema migrations on existing data.
- Cross-domain dependencies.
