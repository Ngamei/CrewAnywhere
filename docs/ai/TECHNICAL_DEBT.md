# Technical Debt — CrewAnywhere

Item format: Where / What / Why it exists / Risk / Fix / Added (date).

## Malformed CLAUDE.md (fixed in this bootstrap)
- Where: `CLAUDE.md`
- What: broken markdown list nesting (stray/duplicated dashes, progressively indented lines) made the rules hard to read.
- Why it exists: accreted edits.
- Risk: AI misreads its own operating instructions.
- Fix: rewritten as a clean, short entry point that points into the brain files and `/docs/ai/` (this bootstrap).
- Added: 2026-07-09

## Malformed markdown in root brain files
- Where: `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md`.
- What: the same progressively-indented / duplicated list-marker corruption (e.g. every line in `TASKS.md` prefixed `- [ ]`, deep nesting in the others) breaks rendering.
- Why it exists: accreted edits, same source as the CLAUDE.md corruption.
- Risk: low; still human-readable but renders poorly and is easy to misparse.
- Fix: propose clean rewrites to the maintainer — these are brain-layer files, so confirm-first before editing (do not silently rewrite).
- Added: 2026-07-09

## Domain features not implemented
- Where: `src/modules/*` (marketplace, hiring/proposals, operations/shifts, payments).
- What: foundation and UI shells exist; the actual domain features are not built (see root `CURRENT_STATE.md`).
- Why it exists: scaffold-first strategy (foundation before features).
- Risk: expected/known; not a defect, but consumers must not assume features are live.
- Fix: implement each domain inside its module against the existing schema + transition engine.
- Added: 2026-07-09

## No automated tests / CI wired
- Where: repo root (`package.json` scripts: dev/build/lint/typecheck only).
- What: no test framework or CI configured; correctness relies on `lint` + `typecheck` + DB constraints.
- Risk: regressions in workflow/ledger logic could land unverified once features grow.
- Fix: add a test framework and CI (unit tests for services/guards, integration tests for the transition engine).
- Added: 2026-07-09

## Unfilled brain-file placeholders
- Where: `CURRENT_STATE.md` ("Immediate Next Step"), `DECISIONS.md` (Open questions), `TASKS.md` ("In Progress").
- What: `[Fill in: ...]` placeholders remain.
- Risk: new sessions lack a concrete "what's next" anchor.
- Fix: fill in with confirmation from the maintainer (brain layer -> confirm-first).
- Added: 2026-07-09
