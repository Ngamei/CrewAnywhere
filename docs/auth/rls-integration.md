# RLS and Auth Integration

Postgres Row Level Security aligns with the platform identity model. Application auth resolves the same actor IDs that RLS helper functions use.

## RLS helper functions

Defined in `schema.sql` / `0001_unified_database_architecture.sql`:

| Function | Returns |
|----------|---------|
| `current_auth_account_id()` | `auth_accounts.id` for `auth.uid()` |
| `current_business_user_id()` | `business_users.id` for current account |
| `current_crew_user_id()` | `crew_users.id` for current account |

## Identity bridge

```txt
auth.users (Supabase JWT → auth.uid())
    ↓ auth_user_id
auth_accounts (account_type: business | crew | admin)
    ├── business_users (business_role: owner | admin | member)
    └── crew_users
```

`IdentityRepository` loads this chain after `getUser()` validates the JWT. The resulting `PlatformSession` exposes IDs used by:

- Ownership validators (`src/shared/auth/ownership.ts`)
- Workflow `transitioned_by` (`auth_accounts.id`)
- Audit logs (`auth_account_id`, `business_user_id`, `crew_user_id`)

## Read vs write policy

| Operation | Client | Enforcement |
|-----------|--------|-------------|
| Self-read (`auth_accounts`, actor rows) | User-scoped Supabase (anon + JWT) | RLS |
| Company owner reads | User-scoped | RLS via `company_profiles.owner_business_user_id` |
| Workflow transitions, ledger writes | Service role | Application services + `transition_workflow_entity` RPC |

**Rule:** Never rely on RLS alone for workflow writes. `transition_workflow_entity` is `SECURITY DEFINER` and revoked from `authenticated`.

## Session client selection

| Use case | Client |
|----------|--------|
| Server Components / Route Handlers (user context) | `createSupabaseServerClient()` |
| Browser (future login UI) | `createSupabaseBrowserClient()` |
| Outbox worker, atomic transitions | `createSupabaseAdminClient()` |

## Account status

RLS and application guards both assume **active** accounts for marketplace operations. `canAuthenticate()` allows `pending_verification` for session establishment; `isAccountEligible()` requires `active` for operational actions.
