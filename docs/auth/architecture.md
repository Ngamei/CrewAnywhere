# Auth Architecture

CrewAnywhere2.0 authentication is built on **Supabase Auth** (JWT sessions) with a **platform identity layer** in Postgres (`auth_accounts` → `business_users` / `crew_users`). Authorization uses application roles mapped from database enums and is enforced in services, API wrappers, and middleware — not only in RLS.

## Layers

```txt
Browser / Server Components
    ↓ createSupabaseBrowserClient | createSupabaseServerClient
Supabase Auth (auth.users, JWT cookies)
    ↓ getUser() — server-validated JWT
Platform session (auth_accounts + actor rows)
    ↓ role guards, ownership validators, workflow transition source
Services / workflow RPC (service role for writes)
```

## Directory layout

| Path | Responsibility |
|------|----------------|
| `src/shared/auth/` | Types, roles, guards, permissions, ownership, provider abstraction, SSR session helpers |
| `src/backend/auth/` | Identity repository, platform session resolution, authenticated actions, service context builder |
| `middleware/` | Route protection config and session cookie refresh (invoked from `src/proxy.ts`) |
| `src/shared/supabase/` | Supabase SSR clients (browser, server, admin) |
| `src/shared/api/with-auth.ts` | API route wrapper for authenticated handlers |
| `docs/auth/` | Auth integration documentation |

## Auth provider abstraction

`SupabaseAuthProvider` (`src/shared/auth/provider.ts`) implements `AuthProvider`. Server code must call **`getUser()`** for authorization decisions; `getSession()` alone is not sufficient for replay-safe validation.

## Application roles

| DB signal | Application role |
|-----------|------------------|
| `account_type = admin` | `platform_admin` |
| `account_type = crew` | `crew` |
| `business_role = owner \| admin` | `business_owner` |
| `business_role = member` | `business_member` |
| Operational shift supervisor | `supervisor` (contextual, not account signup) |

## Workflow integration

Workflow transitions record `transitioned_by` → `auth_accounts.id` and `transition_source` from `resolveWorkflowTransitionSource()` in `src/backend/auth/authorization.ts`. Atomic transitions use the **service role** client; actor checks run in application services before RPC.

## Out of scope (this foundation)

- Login / signup UI
- Onboarding flows
- Profile and marketplace pages

These consume the session API (`GET /api/v1/auth/session`) and `withAuth` wrappers when implemented.
