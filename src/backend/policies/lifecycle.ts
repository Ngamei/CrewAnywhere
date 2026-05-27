import {
  ACCOUNT_STATUS_TRANSITIONS,
  ASSIGNMENT_STATUS_TRANSITIONS,
  EVENT_STATUS_TRANSITIONS,
  JOB_STATUS_TRANSITIONS,
  PROPOSAL_STATUS_TRANSITIONS,
  SHIFT_STATUS_TRANSITIONS,
  type AccountStatus,
  type AssignmentStatus,
  type EventStatus,
  type JobStatus,
  type ProposalStatus,
  type ShiftStatus,
} from '@/domain';

export function canTransitionAccountStatus(from: AccountStatus, to: AccountStatus) {
  return ACCOUNT_STATUS_TRANSITIONS[from].includes(to);
}

export function canTransitionEventStatus(from: EventStatus, to: EventStatus) {
  return EVENT_STATUS_TRANSITIONS[from].includes(to);
}

export function canTransitionJobStatus(from: JobStatus, to: JobStatus) {
  return JOB_STATUS_TRANSITIONS[from].includes(to);
}

export function canTransitionProposalStatus(from: ProposalStatus, to: ProposalStatus) {
  return PROPOSAL_STATUS_TRANSITIONS[from].includes(to);
}

export function canTransitionAssignmentStatus(from: AssignmentStatus, to: AssignmentStatus) {
  return ASSIGNMENT_STATUS_TRANSITIONS[from].includes(to);
}

export function canTransitionShiftStatus(from: ShiftStatus, to: ShiftStatus) {
  return SHIFT_STATUS_TRANSITIONS[from].includes(to);
}
