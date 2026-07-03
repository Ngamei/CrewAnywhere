# Claude Instructions - CrewAnywhere

Operate inside CrewAnywhere only. Do not mix other project context.

## Before Working
Read: PROJECT_CONTEXT.md, CURRENT_STATE.md, DECISIONS.md, TASKS.md
For DB: docs/database/architecture.md

## Project
- Hiring/operations marketplace, Next.js App Router + Supabase
- - Foundation done, domain features NOT yet built
  - - Atomic transition engine governs all state changes
   
    - ## Rules
    - - Never build features outside their domain module
      - - Never bypass the atomic transition engine
        - - Never mix business_user and crew_user logic
          - - Schema changes in Supabase migration files only
            - - Update DECISIONS.md for architecture choices
              - - Update TASKS.md when features change
                - - Ask before modifying shared primitives
                 
                  - ## Flag
                  - - Changes to shared UI primitives
                    - - Changes to auth/session layer
                      - - Schema migrations on existing data
                        - - Cross-domain dependencies
