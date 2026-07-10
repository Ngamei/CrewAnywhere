# Architecture — CrewAnywhere

Modular monolith on Next.js 16 App Router + React 19 + TypeScript (strict) + Tailwind 4 + Supabase (`@supabase/ssr` + `supabase-js`). Detailed docs referenced inline; this is the map.

## Layers
- `src/domain/` — explicit domain boundaries and status/transition rules (source of truth for domain rules): `assignments`, `events`, `identity`, `jobs`, `payments`, `proposals`, `shifts`, plus `shared`.
- `src/modules/<domain>/` — per-domain backend use cases and co-located pieces (`actions`, `services`, `repositories`, `schemas`, and where relevant `components`/`hooks`/`types`). Domains: `assignments`, `events`, `identity`, `jobs`, `marketplace`, `notifications`, `payments`, `profiles`, `proposals`, `shifts`. (`identity` nests its use cases under a `server/` subfolder.)
- `src/backend/` — shared backend primitives: `services`, `repositories`, `policies`, `events`, `workers`, `auth`.
- `src/shared/` — shared cross-cutting primitives: `ui`, `components`, `api`, `auth`, `config`, `design`, `events`, `hooks`, `layouts`, `lib`, `state`, `supabase`.
- `src/app/api/v1/*` — versioned API contracts: `assignments`, `auth`, `business-membership`, `company-profiles`, `crew-profiles`, `events`, `health`, `jobs`, `marketplace`, `payments`, `proposals`, `shifts`, `wallets`, `withdrawals`.
- `src/app/(dashboard)/dashboard/*` — dashboard UI; `src/app/(auth)/login` — auth UI.
- `middleware/*` — session/config middleware (`session.ts`, `config.ts`, `index.ts`).
- Client state: Zustand; validation: Zod.

## State changes
The atomic transition engine governs ALL state changes. See `../database/atomic-transition-engine.md` and `../database/workflow-transition-system.md`. Do not mutate status directly.

## Data & money
- DB baseline: `schema.sql` + `supabase/migrations/*` (`0001_unified_database_architecture.sql` .. `0004_workflow_outbox_worker.sql`); separate `business_users`/`crew_users` behind `auth_accounts`. See `../database/architecture.md` and `../database/migration-structure.md`.
- Financial ledger + escrow + outbox: see `../database/financial-ledger-architecture.md`, `../database/outbox-architecture.md`, `../payments/*`.

## Auth
Session lifecycle, ownership model, RLS integration: see `../auth/*`.

## Deploy
Vercel. `npm run dev|build|lint|typecheck`.
