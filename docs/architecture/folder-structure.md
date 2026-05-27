# Folder Structure

```txt
src/
  app/                         Next.js App Router, layouts, pages, route handlers
    api/v1/                    Versioned API entrypoints
  backend/                     Backend-only service primitives
    auth/                      Platform identity, session resolution, authenticated actions
    events/                    Domain event contracts
    policies/                  Authorization and lifecycle policies
    repositories/              Database access base classes
    services/                  Service context and base service classes
  domain/                      Pure domain constants, types, statuses, transitions
  modules/                     Domain-owned application modules
    <domain>/server/           Server services and use cases
    <domain>/components/       Domain-specific UI components, when needed
    <domain>/schemas/          Validation schemas and DTO mapping
  shared/                      Reusable cross-domain building blocks
    api/                       API response and validation helpers
    auth/                      Session, roles, guards, ownership, provider abstraction
    config/                    Environment and app constants
    lib/                       Small generic utilities
    state/                     Client state foundation
    supabase/                  Supabase clients and middleware
    ui/                        Reusable UI primitives
middleware/                    Route protection and SSR session refresh (used by src/proxy.ts)
supabase/
  migrations/                  Database schema migrations
docs/
  architecture/                Architecture rules for agents and engineers
```

## Module Rule

Each domain module should own its use cases and UI composition. Shared utilities must stay generic. If code mentions a specific domain concept such as proposal, assignment, shift, or payment, it belongs in `src/domain` or `src/modules`, not `src/shared`.
