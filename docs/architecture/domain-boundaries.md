# Domain Boundaries

## Identity

Owns users, account status, auth profile records, roles, memberships, and login eligibility.

## Events

Owns the macro operational container: event dates, venue, organization ownership, and event lifecycle.

## Jobs

Owns staffing requirements under events: role definition, headcount, rate metadata, and job lifecycle.

## Proposals

Owns hiring lifecycle: applications, offers, negotiation, acceptance, withdrawal, and hire decision.

Proposal does not own operational execution after hire.

## Assignments

Owns workforce engagement after hire and funding. Assignment is the authoritative operational object after proposal completion.

## Shifts

Owns attendance execution: scheduling, check-in, check-out, no-show, supervisor confirmation, and attendance validation.

## Payments

Owns escrow funding, payout eligibility, release, refund, and withdrawal coordination. Payment release depends on operational validation.

## Audit

Owns immutable logs for lifecycle transitions, security events, integration events, and operational errors.
