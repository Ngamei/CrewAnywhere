# Folder Structure — CrewAnywhere

- `src/domain/` — domain boundaries and rules (assignments, events, identity, jobs, payments, proposals, shifts, shared)
- `src/modules/<domain>/` — per-domain backend use cases (actions, services, repositories, schemas) plus co-located UI where relevant
- `src/backend/` — shared backend primitives (services, repositories, policies, events, workers, auth)
- `src/shared/` — shared cross-cutting primitives (ui, components, api, auth, config, design, events, hooks, layouts, lib, state, supabase)
- `src/app/api/v1/` — versioned REST endpoints
- `src/app/(dashboard)/`, `src/app/(auth)/` — route groups (UI)
- `middleware/` — session + config
- `docs/` — detailed implementation docs (architecture, auth, database, payments)
- `docs/ai/` — AI index layer (this)
- `schema.sql`, `supabase/migrations/` — database
- Root PDFs — Master Architecture / FDR reference documents
- Meta: `CLAUDE.md`, `.cursor/rules/project.mdc`, `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md`
