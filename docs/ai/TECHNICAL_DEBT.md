# Technical Debt — CrewAnywhere

## Malformed brain-file markdown (CLAUDE.md fixed in this bootstrap)
- **Where:** `CLAUDE.md`, `PROJECT_CONTEXT.md`, and to a lesser extent `CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md`.
- **What:** broken markdown list nesting (each item indented one level deeper than the last via stray `- -` dashes).
- **Why it exists:** hand-authored brain files drifted into invalid nesting.
- **Risk:** an AI misreads its own instructions/context because headings and list items are swallowed into ever-deeper nested lists.
- **Fix:** `CLAUDE.md` rewritten in this bootstrap; `PROJECT_CONTEXT.md` list nesting cleaned (formatting only, wording preserved). `CURRENT_STATE.md` / `DECISIONS.md` / `TASKS.md` are brain files (confirm-first) and left for a follow-up cleanup.
- **Added:** 2026-07-10

## Foundation-only: most domain features unbuilt
- **Where:** `src/modules/*`, dashboard pages.
- **What:** marketplace/hiring/operations/payment flows are scaffolded (actions/services/repositories/schemas present) but the end-to-end features are not implemented.
- **Why it exists:** deliberate scaffold-first approach (foundation before features).
- **Risk:** docs may describe intended behavior not yet in code — mark intended vs implemented.
- **Fix:** as features land, update `docs/ai/NEXT_STEPS.md` and the relevant `docs/`.
- **Added:** 2026-07-10

## Empty repo description
- **Where:** GitHub repository metadata.
- **What:** no one-line description set.
- **Risk:** low; discoverability only.
- **Fix:** set a one-line description.
- **Added:** 2026-07-10
