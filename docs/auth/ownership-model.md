# Ownership Model

Operational marketplace workflows use **redundant ownership columns** on the proposal → assignment → shift → payment → withdrawal chain. Auth validators mirror this model for application-layer checks before service-role RPCs.

## Ownership chain

```txt
company_profiles.owner_business_user_id
    ↓
events.created_by_business_user_id
jobs (via event)
proposals.crew_user_id
    ↓ composite FKs
assignments → shifts → payments → withdrawals
```

See `docs/database/workflow-lifecycle-hardening.md` for composite foreign keys and drift detection.

## Application validators

`src/shared/auth/ownership.ts` provides:

| Function | Purpose |
|----------|---------|
| `assertCompanyOwnership` | Business user owns `company_profiles.owner_business_user_id` |
| `assertCrewOwnership` | Crew user owns `crew_user_id` on entity |
| `assertWorkflowActorOwnership` | Business or crew actor matches workflow ownership context |
| `ownsCompanyProfile` / `ownsCrewResource` | Non-throwing checks |

`platform_admin` bypasses ownership checks for support and system operations.

## Workflow ownership context

```typescript
type WorkflowOwnershipContext = {
  companyProfileId?: string | null;
  crewUserId?: string | null;
  businessUserId?: string | null;
  jobId?: string | null;
  eventId?: string | null;
};
```

Pass ownership loaded from the entity row into validators **before** calling `transition_workflow_entity`.

## RLS alignment

RLS policies use `current_business_user_id()` and `current_crew_user_id()`. Application ownership validators must use the same IDs resolved in `PlatformSession.identity` to avoid authorization drift between app and database.

## Supervisor role

`supervisor` is an operational role (e.g. `shifts.supervisor_business_user_id`), not an `account_type`. Map to `supervisor` application role in shift-specific guards when that UI is built.
