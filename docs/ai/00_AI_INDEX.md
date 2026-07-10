# AI Docs Index — CrewAnywhere

AI navigation layer. Detailed implementation truth already lives in `docs/`; this indexes it.

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — platform model, lifecycle, hierarchy
- [ARCHITECTURE.md](ARCHITECTURE.md) — modular monolith; links into docs/architecture, docs/database, docs/auth, docs/payments
- [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) — where each layer lives
- [DECISIONS.md](DECISIONS.md) — architectural decisions (cross-links root DECISIONS.md)
- [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) — known debt and risks
- [NEXT_STEPS.md](NEXT_STEPS.md) — concrete near-term work
- [AI_PROJECT_BUILDING_PROMPT.md](AI_PROJECT_BUILDING_PROMPT.md) — the standard these docs follow

## Detailed docs (source of truth — do not duplicate here)
- Architecture: `../architecture/README.md`, `../architecture/domain-boundaries.md`, `../architecture/folder-structure.md`, `../architecture/naming-conventions.md`, `../architecture/mobile-readiness.md`
- Auth: `../auth/architecture.md`, `../auth/ownership-model.md`, `../auth/rls-integration.md`, `../auth/session-lifecycle.md`
- Database: `../database/architecture.md`, `../database/atomic-transition-engine.md`, `../database/workflow-transition-system.md`, `../database/workflow-lifecycle-hardening.md`, `../database/status-event-synchronization.md`, `../database/event-propagation-flow.md`, `../database/financial-ledger-architecture.md`, `../database/outbox-architecture.md`, `../database/outbox-retry-lifecycle.md`, `../database/migration-structure.md`
- Payments: `../payments/architecture.md`, `../payments/escrow-lifecycle-mapping.md`, `../payments/wallet-operational-flow.md`, `../payments/ledger-ui-integration.md`

Brain layer (root, confirm-first): `../../PROJECT_CONTEXT.md`, `../../CURRENT_STATE.md`, `../../DECISIONS.md`, `../../TASKS.md`.
