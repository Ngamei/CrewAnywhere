import type { EntityId, ISODateTime } from '@/domain';

export type DomainEventName =
  | 'identity.account_created'
  | 'profiles.company_profile_created'
  | 'profiles.company_profile_updated'
  | 'profiles.crew_profile_created'
  | 'profiles.crew_profile_updated'
  | 'profiles.profile_readiness_changed'
  | 'events.event_created'
  | 'events.event_updated'
  | 'events.event_opened'
  | 'events.event_status_changed'
  | 'jobs.job_created'
  | 'jobs.job_updated'
  | 'jobs.job_opened'
  | 'jobs.job_status_changed'
  | 'proposals.proposal_created'
  | 'proposals.proposal_reviewed'
  | 'proposals.proposal_accepted'
  | 'proposals.proposal_rejected'
  | 'proposals.proposal_submitted'
  | 'proposals.proposal_hired'
  | 'assignments.assignment_created'
  | 'shifts.shift_check_in'
  | 'shifts.shift_check_out'
  | 'shifts.shift_started'
  | 'shifts.shift_completed'
  | 'shifts.shift_cancelled'
  | 'shifts.shift_no_show'
  | 'payments.escrow_funded'
  | 'payments.payment_authorized'
  | 'payments.payment_released'
  | 'payments.wallet_credited'
  | 'payments.refund_created'
  | 'audit.event_recorded';

export type DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  id: EntityId;
  name: DomainEventName;
  aggregateId: EntityId;
  occurredAt: ISODateTime;
  payload: TPayload;
};
