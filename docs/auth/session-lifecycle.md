# Session Lifecycle

## Request flow

```mermaid
sequenceDiagram
  participant Browser
  participant Proxy as src/proxy.ts
  participant MW as middleware/session
  participant Supabase as Supabase Auth
  participant App as Route / Service

  Browser->>Proxy: HTTP request + cookies
  Proxy->>MW: handleSession()
  MW->>Supabase: auth.getUser()
  Supabase-->>MW: user | null
  MW->>MW: refresh cookies on response
  alt protected page, no user
    MW-->>Browser: redirect /login
  else protected API, no user
    MW-->>Browser: 401 JSON
  else ok
    MW-->>App: NextResponse.next
    App->>Supabase: getUser() again (replay-safe)
    App->>App: resolvePlatformSession()
  end
```

## Cookie handling

- `@supabase/ssr` manages auth cookies on server and middleware paths.
- `handleSession` in `middleware/session.ts` refreshes tokens via `getUser()` (validates JWT server-side).
- Production cookies should use `secure: true` (see `src/shared/config/auth.ts`).

## Platform session resolution

1. `createSupabaseServerClient()` reads cookies.
2. `defaultAuthProvider.getUser()` validates JWT.
3. `IdentityRepository` loads `auth_accounts` and actor row.
4. `resolveAppRole()` maps to application role.
5. `PlatformSession` returned to handlers.

**Replay safety:** Authorization never uses unvalidated `getSession()` claims. Both middleware and services call `getUser()`.

## Session API

`GET /api/v1/auth/session`

| State | Response |
|-------|----------|
| Unauthenticated | `{ authenticated: false }` |
| Authenticated | `toPlatformSessionPayload(session)` — no tokens |

## Sign-out

Use `defaultAuthProvider.signOut(client)` via server client when implementing logout.

## Platform `sessions` table

`public.sessions` stores platform session metadata (hashed tokens, device info). Supabase Auth cookies remain the primary web session mechanism. Extend to device tracking when mobile clients are added.

## Protected routes

Configured in `middleware/config.ts`:

- **Public:** `/`, `/login`, `/api/v1/health`, `/api/v1/auth/session`
- **Protected API prefix:** `/api/v1/*` (except public paths)
- **Protected pages:** `/dashboard/*`

Add prefixes as new operational surfaces ship.
