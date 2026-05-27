import type { JobRecord } from '@/modules/jobs/types/job-records';
import type { ProposalRecord } from '@/modules/proposals/types/proposal-records';
import type { AssignmentRecord } from '@/modules/assignments/types/assignment-records';
import type { ShiftRecord } from '@/modules/shifts/types/shift-records';
import type { EscrowRecord, PaymentRecord } from '@/modules/payments/types/payment-records';
import type { CrewProfileRecord } from '@/modules/profiles/types/profile-records';
import {
  isAttendanceWindowExpired,
  isAttendanceWindowOpen,
} from '@/modules/shifts/hooks/shift-attendance';
import { ownsCompanyProfile } from '@/shared/auth/ownership';
import type { PlatformIdentity } from '@/shared/auth/types';
import type { WorkflowGuardResult } from './types';

export type ProposalGuardContext = {
  identity: PlatformIdentity;
  proposal: ProposalRecord;
  job: JobRecord;
  crewProfile: CrewProfileRecord | null;
  ownerBusinessUserId: string;
};

export type AssignmentGuardContext = {
  identity: PlatformIdentity;
  proposal: ProposalRecord;
  ownerBusinessUserId: string;
};

export type PaymentGuardContext = {
  identity: PlatformIdentity;
  payment: PaymentRecord;
  assignment: AssignmentRecord;
  escrow: EscrowRecord | null;
  shifts: ShiftRecord[];
  ownerBusinessUserId: string;
  shiftCompleted?: boolean;
  attendanceValidated?: boolean;
  refundApproved?: boolean;
};

export type ShiftGuardContext = {
  identity: PlatformIdentity;
  shift: ShiftRecord;
  assignment: AssignmentRecord;
  ownerBusinessUserId: string;
  /** When true, attendance QR/supervisor verification is treated as satisfied (foundation stub). */
  attendanceVerified?: boolean;
  /** When true, supervisor confirmed checkout (foundation stub). */
  supervisorConfirmed?: boolean;
  /** When true, operational incident recorded for admin cancel (foundation stub). */
  incidentRecorded?: boolean;
  now?: Date;
};

function result(checks: WorkflowGuardResult['checks']): WorkflowGuardResult {
  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}

/**
 * Foundation payment authorization — assignments/payments module will replace the stub.
 * @see docs/database/workflow-transition-system.md — `payment_authorized` guard
 */
export function evaluatePaymentAuthorizedFoundation(): WorkflowGuardResult['checks'][number] {
  const foundationStubEnabled = process.env.CREWANYWHERE_FOUNDATION_PAYMENT_STUB !== 'false';
  return {
    key: 'payment_authorized',
    passed: foundationStubEnabled,
    detail: foundationStubEnabled ? 'foundation_stub' : 'payment_required',
  };
}

export function evaluateProposalGuards(
  guardKeys: readonly string[],
  context: ProposalGuardContext,
): WorkflowGuardResult {
  const checks: WorkflowGuardResult['checks'] = [];

  for (const key of guardKeys) {
    switch (key) {
      case 'job_open':
        checks.push({
          key,
          passed: context.job.status === 'open' || context.job.status === 'reviewing',
        });
        break;
      case 'crew_marketplace_ready':
        checks.push({
          key,
          passed: context.crewProfile?.marketplace_ready === true && context.crewProfile.profile_published,
        });
        break;
      case 'business_owns_job':
        checks.push({
          key,
          passed: ownsCompanyProfile(context.identity, context.ownerBusinessUserId),
        });
        break;
      case 'proposal_active':
        checks.push({
          key,
          passed: context.proposal.status === 'applied' || context.proposal.status === 'offer_sent',
        });
        break;
      case 'crew_owns_proposal':
        checks.push({
          key,
          passed: context.identity.crewUser?.id === context.proposal.crew_user_id,
        });
        break;
      case 'offer_valid':
        checks.push({
          key,
          passed: context.proposal.status === 'offer_sent',
        });
        break;
      case 'payment_authorized':
        checks.push(evaluatePaymentAuthorizedFoundation());
        break;
      default:
        checks.push({ key, passed: false, detail: `unknown_guard:${key}` });
    }
  }

  return result(checks);
}

export function evaluateAssignmentGuards(
  guardKeys: readonly string[],
  context: AssignmentGuardContext,
): WorkflowGuardResult {
  const checks: WorkflowGuardResult['checks'] = [];

  for (const key of guardKeys) {
    switch (key) {
      case 'proposal_hired':
        checks.push({ key, passed: context.proposal.status === 'hired' });
        break;
      case 'payment_authorized':
        checks.push(evaluatePaymentAuthorizedFoundation());
        break;
      case 'business_or_admin_authorized':
        checks.push({
          key,
          passed:
            context.identity.role === 'platform_admin' ||
            ownsCompanyProfile(context.identity, context.ownerBusinessUserId),
        });
        break;
      default:
        checks.push({ key, passed: false, detail: `unknown_guard:${key}` });
    }
  }

  return result(checks);
}

function evaluateShiftAuthorization(
  key: string,
  context: ShiftGuardContext,
  level: 'business_or_admin' | 'supervisor_or_admin' | 'admin',
): WorkflowGuardResult['checks'][number] {
  const { identity, shift, ownerBusinessUserId } = context;
  const isAdmin = identity.role === 'platform_admin';
  const ownsCompany = ownsCompanyProfile(identity, ownerBusinessUserId);
  const isSupervisor =
    identity.businessUser?.id != null &&
    shift.supervisor_business_user_id != null &&
    identity.businessUser.id === shift.supervisor_business_user_id;

  let passed = false;
  if (level === 'admin') {
    passed = isAdmin;
  } else if (level === 'supervisor_or_admin') {
    passed = isAdmin || isSupervisor;
  } else {
    passed = isAdmin || ownsCompany;
  }

  return { key, passed, detail: passed ? undefined : 'not_authorized' };
}

/**
 * Evaluates shift workflow guards for `transition_workflow_entity`.
 * Foundation stubs apply for attendance verification and incident recording.
 */
export function evaluateShiftGuards(
  guardKeys: readonly string[],
  context: ShiftGuardContext,
): WorkflowGuardResult {
  const checks: WorkflowGuardResult['checks'] = [];
  const now = context.now ?? new Date();
  const attendanceStubEnabled = process.env.CREWANYWHERE_FOUNDATION_ATTENDANCE_STUB !== 'false';
  const incidentStubEnabled = process.env.CREWANYWHERE_FOUNDATION_INCIDENT_STUB !== 'false';

  for (const key of guardKeys) {
    switch (key) {
      case 'assignment_not_cancelled':
        checks.push({
          key,
          passed: context.assignment.status !== 'cancelled',
          detail:
            context.assignment.status === 'cancelled' ? 'assignment_cancelled' : undefined,
        });
        break;
      case 'attendance_window_open':
        checks.push({
          key,
          passed: isAttendanceWindowOpen(context.shift.starts_at, now),
        });
        break;
      case 'attendance_window_expired':
        checks.push({
          key,
          passed: isAttendanceWindowExpired(context.shift.starts_at, now),
        });
        break;
      case 'qr_or_supervisor_verified':
        checks.push({
          key,
          passed: context.attendanceVerified === true || attendanceStubEnabled,
          detail: attendanceStubEnabled ? 'foundation_stub' : undefined,
        });
        break;
      case 'check_in_verified':
        checks.push({
          key,
          passed: context.shift.check_in_at != null,
          detail: context.shift.check_in_at == null ? 'check_in_required' : undefined,
        });
        break;
      case 'checkout_verified':
        checks.push({
          key,
          passed: context.shift.check_out_at != null,
          detail: context.shift.check_out_at == null ? 'check_out_required' : undefined,
        });
        break;
      case 'supervisor_confirmation':
        checks.push({
          key,
          passed: context.supervisorConfirmed === true || attendanceStubEnabled,
          detail: attendanceStubEnabled ? 'foundation_stub' : undefined,
        });
        break;
      case 'business_or_admin_authorized':
        checks.push(evaluateShiftAuthorization(key, context, 'business_or_admin'));
        break;
      case 'supervisor_or_admin_authorized':
        checks.push(evaluateShiftAuthorization(key, context, 'supervisor_or_admin'));
        break;
      case 'admin_authorized':
        checks.push(evaluateShiftAuthorization(key, context, 'admin'));
        break;
      case 'incident_recorded':
        checks.push({
          key,
          passed: context.incidentRecorded === true || incidentStubEnabled,
          detail: incidentStubEnabled ? 'foundation_stub' : undefined,
        });
        break;
      default:
        checks.push({ key, passed: false, detail: `unknown_guard:${key}` });
    }
  }

  return result(checks);
}

function hasCompletedShift(shifts: ShiftRecord[]): boolean {
  return shifts.some((shift) => shift.status === 'completed');
}

function hasValidatedAttendance(shifts: ShiftRecord[]): boolean {
  return shifts.some(
    (shift) =>
      shift.status === 'completed' && shift.check_in_at != null && shift.check_out_at != null,
  );
}

/**
 * Evaluates payment workflow guards for `transition_workflow_entity`.
 */
export function evaluatePaymentGuards(
  guardKeys: readonly string[],
  context: PaymentGuardContext,
): WorkflowGuardResult {
  const checks: WorkflowGuardResult['checks'] = [];
  const paymentStubEnabled = process.env.CREWANYWHERE_FOUNDATION_PAYMENT_STUB !== 'false';
  const attendanceStubEnabled = process.env.CREWANYWHERE_FOUNDATION_ATTENDANCE_STUB !== 'false';

  for (const key of guardKeys) {
    switch (key) {
      case 'assignment_created':
        checks.push({
          key,
          passed: context.assignment.id === context.payment.assignment_id,
        });
        break;
      case 'business_payment_method_valid':
        checks.push({
          key,
          passed: paymentStubEnabled || context.payment.status !== 'pending',
          detail: paymentStubEnabled ? 'foundation_stub' : undefined,
        });
        break;
      case 'payment_authorized':
        checks.push({
          key,
          passed:
            paymentStubEnabled ||
            context.payment.status === 'authorized' ||
            context.payment.status === 'funded' ||
            context.payment.status === 'released',
          detail: paymentStubEnabled ? 'foundation_stub' : undefined,
        });
        break;
      case 'escrow_funded':
        checks.push({
          key,
          passed:
            context.escrow != null &&
            (context.escrow.status === 'funded' ||
              context.escrow.status === 'held' ||
              context.escrow.amount_held === context.payment.amount),
        });
        break;
      case 'escrow_not_funded':
        checks.push({
          key,
          passed: context.escrow == null || context.escrow.status === 'awaiting_funding',
        });
        break;
      case 'shift_completed':
        checks.push({
          key,
          passed: context.shiftCompleted === true || hasCompletedShift(context.shifts),
        });
        break;
      case 'attendance_validated':
        checks.push({
          key,
          passed:
            context.attendanceValidated === true ||
            hasValidatedAttendance(context.shifts) ||
            attendanceStubEnabled,
          detail: attendanceStubEnabled ? 'foundation_stub' : undefined,
        });
        break;
      case 'ledger_group_balanced':
        checks.push({
          key,
          passed: paymentStubEnabled || context.escrow != null,
          detail: paymentStubEnabled ? 'foundation_stub' : 'deferred_db_constraint',
        });
        break;
      case 'refund_approved':
        checks.push({
          key,
          passed: context.refundApproved === true || paymentStubEnabled,
          detail: paymentStubEnabled ? 'foundation_stub' : undefined,
        });
        break;
      case 'provider_failure_recorded':
      case 'assignment_cancelled_or_admin':
      case 'dispute_approved':
      case 'ledger_reversal_created':
        checks.push({
          key,
          passed: paymentStubEnabled,
          detail: paymentStubEnabled ? 'foundation_stub' : 'not_implemented',
        });
        break;
      default:
        checks.push({ key, passed: false, detail: `unknown_guard:${key}` });
    }
  }

  return result(checks);
}
