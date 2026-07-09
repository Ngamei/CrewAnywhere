# Next Steps — CrewAnywhere

From root `CURRENT_STATE.md` (immediate next step) and `TASKS.md` (Next Up). Keep in sync with those; brain updates are confirm-first.

## Immediate
- Confirm which domain module is built first (marketplace, hiring, operations, or payments) — root `CURRENT_STATE.md` and `DECISIONS.md` leave this open. Do not infer.
- Once chosen: define MVP scope for that module and write its domain schema migration(s) under `supabase/migrations/`.

## Backlog (from TASKS.md)
- Choose first domain module; define MVP scope; write domain schema migrations.
- Implement domain modules in order: marketplace, hiring, operations, payments.
- Mobile app (future) — see `docs/architecture/mobile-readiness.md`.

## Doc-hygiene (from this bootstrap)
- Verify `/docs/ai` facts against the code after landing; re-audit any domain whose deep doc drifts.
- Propose clean rewrites of the malformed markdown in the root brain files (`PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md`) — confirm-first.
- Consider adding a test framework + CI (see TECHNICAL_DEBT.md).
