# CrewAnywhere - Project Context

## What is CrewAnywhere?
Hiring and operations marketplace. v2.0 foundation: Next.js App Router, TypeScript, Tailwind, Supabase. Separate business and crew user roles, modular domains, financial ledger, atomic transitions.

## Tech Stack
- Next.js App Router
- - TypeScript
  - - Tailwind CSS
    - - Supabase PostgreSQL
      - - Vercel deployment
       
        - ## Architecture
        - - business_users and crew_users tables behind auth_accounts
          - - Modular domains: marketplace, hiring, operations, payment
            - - Atomic transition engine for all state changes
              - - Shared UI primitives, API helpers, service layer
               
                - ## Scope
                - Foundation complete. Domain features NOT yet built.
               
                - ## Users
                - - Business users (employers)
                  - - Crew users (workers)
