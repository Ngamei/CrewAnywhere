# AI Project Building Prompt

Master operating prompt for auditing, documenting, and building one codebase. It governs HOW an AI works inside a single project repo; it does not replace the always-on global rules.

## Precedence
1. Global rules (identity, project isolation, communication) — from the ai-brain vault.
2. Personal work style — short, decisive, smallest useful next step.
3. The project's brain files — PROJECT_CONTEXT.md, CURRENT_STATE.md, TASKS.md, DECISIONS.md.
4. This repo's CLAUDE.md -> follow links into /docs/ai/.
5. Only then write code/content.

## Project isolation gate (first, every time)
- Confirm which repo is active before auditing or writing.
- Never merge context across projects. This repo is CrewAnywhere (Ngamei/CrewAnywhere); do not mix in any other project's context.

## When to run the full audit vs skip
- Full audit + /docs/ai bootstrap: project bootstrap, onboarding onto unfamiliar code, or planning a non-trivial feature.
- Small scoped changes (typo/one-line fixes): skip the audit, follow personal work style.

## Audit-before-code
1. Walk the repo; map structure and entry points.
2. Identify architecture and how a request/page flows end to end.
3. Trace data/content flow and how it's produced/deployed.
4. Map permissions/auth boundaries.
5. List routes/pages and what each does.
6. Note where logic lives (service layer, not scattered).
7. Capture gaps, risks, technical debt.

## /docs/ai structure (Phase 1 minimum)
CLAUDE.md at root (short entry point) plus:
docs/ai/00_AI_INDEX.md, PROJECT_OVERVIEW.md, ARCHITECTURE.md, FOLDER_STRUCTURE.md, DECISIONS.md, TECHNICAL_DEBT.md, NEXT_STEPS.md

## Documentation quality standard
State implementation truth with concrete paths, not vague summaries.
Bad: "The projects page shows a list of projects."
Good: "app/projects/[id]/page.tsx is a server component that loads via getProject(id) in lib/services/projects.ts; mutations go through the updateProject server action validated by projectSchema."

## Format templates
TECHNICAL_DEBT.md item: Where / What / Why it exists / Risk / Fix / Added (date).
DECISIONS.md item: Date / Context / Options / Decision / Consequences.
Implementation plan: Goal / Assumptions / Affected areas / Approach / Risks & trade-offs / Out of scope.
End-of-session summary: Changed / Repo /docs/ai updates / Proposed brain updates (confirm-first) / Open questions.

## Layered documentation-update rule
- Repo /docs/ai/: AI may update after meaningful changes (keep in sync with code).
- Brain files (CURRENT_STATE/TASKS/DECISIONS): confirm-first; propose concrete candidates, write only after confirmation.

## Doc freshness
If a /docs/ai file is stale vs the code (e.g. ARCHITECTURE.md predates a refactor), re-audit that domain only.

## Cursor note
Honor .cursor/rules/ (project.mdc) as well as CLAUDE.md; keep them consistent.
