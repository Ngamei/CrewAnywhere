# CrewAnywhere

CrewAnywhere2.0 technical foundation built with Next.js App Router, TypeScript, Tailwind, Supabase, modular domain boundaries, reusable UI primitives, and backend service-layer structure.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Foundation Scope

This scaffold includes:

- Repo and folder structure
- Shared architecture rules
- Supabase schema migration
- Unified PostgreSQL schema in `schema.sql`
- Auth/session foundation
- Shared UI primitives
- API response and validation helpers
- Backend service-layer primitives
- Domain status constants and transition rules
- Client state foundation

Marketplace, hiring, operations, and payment features should be implemented later inside their domain-owned modules.

## Database

The current database-first baseline uses separate `business_users` and `crew_users` tables behind `auth_accounts`.

See:

- `schema.sql`
- `supabase/migrations/0001_unified_database_architecture.sql`
- `docs/database/architecture.md`
- `docs/database/financial-ledger-architecture.md`
- `docs/database/workflow-transition-system.md`
- `docs/database/atomic-transition-engine.md`
- `docs/database/status-event-synchronization.md`
