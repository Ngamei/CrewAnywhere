# AI Docs Index — CrewAnywhere

Implementation truth for this repo. High-level state lives in the root brain files.

This layer **indexes** the existing deep docs under `/docs/` — it does not duplicate them. When a topic is covered in `docs/architecture/`, `docs/auth/`, `docs/database/`, or `docs/payments/`, this layer points there.

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — what CrewAnywhere is, who it serves, current scope
- [ARCHITECTURE.md](ARCHITECTURE.md) — architecture map + index into `docs/architecture/`, `docs/auth/`, `docs/database/`, `docs/payments/`
- [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) — top-level layout and where each concern lives
- [DECISIONS.md](DECISIONS.md) — implementation/architecture decisions (cross-links root DECISIONS.md)
- [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) — known debt and risks
- [NEXT_STEPS.md](NEXT_STEPS.md) — concrete near-term work
- [AI_PROJECT_BUILDING_PROMPT.md](AI_PROJECT_BUILDING_PROMPT.md) — the standard this repo's docs follow

Brain layer (root, confirm-first): `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md`.

Existing deep docs (source of truth for their domains):
- `docs/architecture/` — folder structure, domain boundaries, naming, mobile readiness
- `docs/auth/` — auth architecture, ownership model, RLS integration, session lifecycle
- `docs/database/` — schema, atomic transition engine, outbox, ledger, workflow hardening
- `docs/payments/` — payments operational architecture, escrow, ledger UI, wallet flow
