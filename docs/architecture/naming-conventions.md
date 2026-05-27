# Naming Conventions

## Files and Folders

- Use kebab-case for route folders and component files: `status-badge.tsx`, `job-detail`.
- Use domain nouns for module folders: `identity`, `events`, `jobs`, `proposals`, `assignments`, `shifts`, `payments`.
- Use suffixes to signal purpose:
  - `*.service.ts` for application service classes.
  - `*.repository.ts` for persistence access.
  - `*.schema.ts` for Zod validation schemas.
  - `*.types.ts` for shared TypeScript types.
  - `*.status.ts` or `status.ts` for canonical lifecycle states.

## Types

- Use PascalCase for exported types and classes.
- Use lowercase snake_case for persisted enum values because Supabase/Postgres stores them directly.
- Use uppercase constant arrays for canonical enum sets, for example `JOB_STATUSES`.

## APIs

- Use versioned API routes under `/api/v1`.
- Use resource families by domain: `/api/v1/events`, `/api/v1/jobs`, `/api/v1/proposals`.
- Use command-style subroutes for lifecycle transitions when a transition has business meaning.
- API responses should use the shared `{ data, meta }` and `{ error, meta }` shapes from `src/shared/api/responses.ts`.

## Database

- Use plural table names: `auth_accounts`, `business_users`, `crew_users`, `company_profiles`, `crew_profiles`, `events`, `jobs`, `proposals`, `assignments`, `shifts`, `payments`, `audit_logs`.
- Use `*_id` for foreign keys.
- Use `created_at` and `updated_at` timestamps on mutable tables.
- Use append-only audit tables for security-sensitive and lifecycle events.
