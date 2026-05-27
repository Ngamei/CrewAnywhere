import {
  WorkflowTransitionExecutor,
  buildIdempotencyKey,
  evaluateShiftGuards,
} from '@/backend/services/workflow';
import type { WorkflowTransitionEventRecord } from '@/backend/services/workflow';
import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import {
  getTransitionedByAuthAccountId,
  resolveWorkflowTransitionSource,
} from '@/backend/auth/authorization';
import { AppError, ConflictError, NotFoundError } from '@/shared/api/errors';
import { assertBusinessUser, assertCrewUser } from '@/shared/auth/guards';
import { assertCrewOwnership } from '@/shared/auth/ownership';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import { publishStaffingDomainEvent } from '@/modules/events/services/domain-event-publisher';
import { PaymentService } from '@/modules/payments/services';
import { assertEventCompanyAccess } from '@/modules/events/hooks';
import { AssignmentRepository } from '@/modules/assignments/repositories';
import { ShiftRepository } from '@/modules/shifts/repositories';
import { buildAttendanceMetadata } from '@/modules/shifts/hooks';
import type {
  ScheduleShiftInput,
  ShiftAttendanceInput,
  ShiftTransitionInput,
} from '@/modules/shifts/schemas';
import type { ShiftDto } from '@/modules/shifts/types';
import type { ShiftRecord } from '@/modules/shifts/types/shift-records';
import { shiftWorkflowMachine } from '@/shared/state/workflows/shift-lifecycle';
import type { ShiftStatus } from '@/shared/state/enums/shift-status';
import type { ShiftTransitionName } from '@/shared/state/workflows/shift-lifecycle';

type ShiftTransitionOptions = {
  reason: string;
  idempotencyKey?: string;
  attendanceVerified?: boolean;
  supervisorConfirmed?: boolean;
  incidentRecorded?: boolean;
  attendanceMetadata?: Record<string, unknown>;
};

export class ShiftService extends AuthenticatedBaseService {
  private readonly executor = new WorkflowTransitionExecutor();

  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getShiftRepository() {
    return new ShiftRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getAssignmentRepository() {
    return new AssignmentRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private resolveTransitionName(from: ShiftStatus | null, to: ShiftStatus): ShiftTransitionName {
    const transition = shiftWorkflowMachine.getTransition(from, to);
    if (!transition) {
      throw new AppError('INVALID_TRANSITION', `No workflow transition from ${from} to ${to}`, 422);
    }
    return transition.name;
  }

  private transitionGuardKeys(transitionName: ShiftTransitionName): readonly string[] {
    return shiftWorkflowMachine.getTransitionByName(transitionName)?.metadata.guardKeys ?? [];
  }

  private async loadShiftContext(shiftId: string) {
    const shift = await this.getShiftRepository().findById(shiftId);
    if (!shift) throw new NotFoundError('Shift not found.');

    const assignment = await this.getAssignmentRepository().findById(shift.assignment_id);
    if (!assignment) throw new NotFoundError('Assignment not found for shift.');

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformSession().identity,
      shift.company_profile_id,
    );

    return { shift, assignment, ownerBusinessUserId: company.owner_business_user_id };
  }

  private async toDto(
    shift: ShiftRecord,
    lastTransition: WorkflowTransitionEventRecord | null = null,
    attendance?: ShiftDto['attendance'],
  ): Promise<ShiftDto> {
    return { ...shift, lastTransition, attendance: attendance ?? null };
  }

  private async runTransition(
    shift: ShiftRecord,
    toStatus: ShiftStatus,
    transitionName: ShiftTransitionName,
    guardKeys: readonly string[],
    options: ShiftTransitionOptions,
  ): Promise<{ shift: ShiftRecord; event: WorkflowTransitionEventRecord }> {
    const { identity } = this.requirePlatformSession();
    const assignment = await this.getAssignmentRepository().findById(shift.assignment_id);
    if (!assignment) throw new NotFoundError('Assignment not found for shift.');

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      identity,
      shift.company_profile_id,
    );

    const guardResult = evaluateShiftGuards(guardKeys, {
      identity,
      shift,
      assignment,
      ownerBusinessUserId: company.owner_business_user_id,
      attendanceVerified: options.attendanceVerified,
      supervisorConfirmed: options.supervisorConfirmed,
      incidentRecorded: options.incidentRecorded,
    });

    const fromStatus = shift.status;
    const key =
      options.idempotencyKey ??
      buildIdempotencyKey({
        entityType: 'shift',
        entityId: shift.id,
        transitionName,
        requestId: this.context.requestId,
      });

    const isInitial = fromStatus === toStatus && shift.status_version === 0;

    const event = await this.executor.execute({
      entityType: 'shift',
      entityId: shift.id,
      toStatus,
      transitionReason: options.reason,
      transitionedBy: getTransitionedByAuthAccountId(identity),
      transitionSource: resolveWorkflowTransitionSource(identity),
      guardResult,
      metadata: {
        requestId: this.context.requestId,
        transitionName,
        ...(options.attendanceMetadata ? { attendance: options.attendanceMetadata } : {}),
      },
      idempotencyKey: key,
      correlationId: this.context.requestId,
      expectedFromStatus: isInitial ? null : fromStatus,
      expectedFromStatusVersion: isInitial ? null : shift.status_version,
    });

    const refreshed = await this.getShiftRepository().findById(shift.id);
    if (!refreshed) throw new NotFoundError('Shift not found after transition.');

    return { shift: refreshed, event };
  }

  async scheduleFromAssignment(
    assignmentId: string,
    input: ScheduleShiftInput = {},
  ): Promise<ShiftDto> {
    const { identity } = this.requirePlatformSession();
    assertBusinessUser(identity);

    const assignment = await this.getAssignmentRepository().findById(assignmentId);
    if (!assignment) throw new NotFoundError('Assignment not found.');

    await assertEventCompanyAccess(
      this.context.supabase,
      identity,
      assignment.company_profile_id,
    );

    if (assignment.status === 'cancelled') {
      throw new AppError('ASSIGNMENT_CANCELLED', 'Cannot schedule shift for cancelled assignment.', 422);
    }

    const startsAt = input.startsAt ?? assignment.scheduled_start_at;
    const endsAt = input.endsAt ?? assignment.scheduled_end_at;

    if (!startsAt || !endsAt) {
      throw new AppError(
        'SHIFT_SCHEDULE_REQUIRED',
        'Assignment must have scheduled start and end times to create a shift.',
        422,
      );
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      throw new AppError('SHIFT_TIME_INVALID', 'Shift end must be after shift start.', 422);
    }

    const shiftRepo = this.getShiftRepository();
    const shift = await shiftRepo.insertFromAssignment({
      assignmentId: assignment.id,
      eventId: assignment.event_id,
      jobId: assignment.job_id,
      companyProfileId: assignment.company_profile_id,
      crewUserId: assignment.crew_user_id,
      startsAt,
      endsAt,
      supervisorBusinessUserId: input.supervisorBusinessUserId,
    });

    const transitionName = this.resolveTransitionName(null, 'scheduled');
    const guardKeys = this.transitionGuardKeys(transitionName);

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      identity,
      assignment.company_profile_id,
    );

    const guardResult = evaluateShiftGuards(guardKeys, {
      identity,
      shift,
      assignment,
      ownerBusinessUserId: company.owner_business_user_id,
    });

    const transition = await this.executor.execute({
      entityType: 'shift',
      entityId: shift.id,
      toStatus: 'scheduled',
      transitionReason: input.reason ?? 'Shift scheduled from assignment',
      transitionedBy: getTransitionedByAuthAccountId(identity),
      transitionSource: resolveWorkflowTransitionSource(identity),
      guardResult,
      metadata: { requestId: this.context.requestId, transitionName, assignmentId },
      idempotencyKey:
        input.idempotencyKey ??
        buildIdempotencyKey({
          entityType: 'shift',
          entityId: shift.id,
          transitionName,
          requestId: this.context.requestId,
        }),
      correlationId: this.context.requestId,
      expectedFromStatus: null,
      expectedFromStatusVersion: null,
    });

    const refreshed = await shiftRepo.findById(shift.id);
    if (!refreshed) throw new NotFoundError('Shift not found after scheduling.');

    return this.toDto(refreshed, transition);
  }

  async checkIn(shiftId: string, input: ShiftAttendanceInput = {}): Promise<ShiftDto> {
    const { identity } = this.requirePlatformSession();
    assertCrewUser(identity);

    const { shift, assignment } = await this.loadShiftContext(shiftId);
    assertCrewOwnership(identity, shift.crew_user_id);

    if (shift.status !== 'scheduled') {
      throw new AppError('SHIFT_NOT_SCHEDULED', 'Only scheduled shifts can be checked in.', 422);
    }

    const checkInAt = input.verifiedAt ?? new Date().toISOString();
    const attendanceMetadata = buildAttendanceMetadata({
      checkInAt,
      startsAt: shift.starts_at,
      method: input.method,
      evidence: input.evidence,
    });

    const transitionName = this.resolveTransitionName('scheduled', 'checked_in');
    const { shift: updated, event } = await this.runTransition(shift, 'checked_in', transitionName, this.transitionGuardKeys(transitionName), {
      reason: input.reason ?? 'Crew check-in',
      idempotencyKey: input.idempotencyKey,
      attendanceVerified: input.method != null || input.evidence != null,
      attendanceMetadata,
    });

    const withCheckIn = await this.getShiftRepository().recordCheckIn(updated.id, checkInAt);

    publishStaffingDomainEvent(
      'shifts.shift_check_in',
      withCheckIn.id,
      {
        assignmentId: assignment.id,
        checkInAt,
        attendance: attendanceMetadata,
        workflowEventId: event.workflow_event_id,
      },
      this.context.requestId,
    );

    return this.toDto(withCheckIn, event, attendanceMetadata);
  }

  async startShift(shiftId: string, input: ShiftTransitionInput = {}): Promise<ShiftDto> {
    const { identity } = this.requirePlatformSession();
    assertCrewUser(identity);

    const { shift } = await this.loadShiftContext(shiftId);
    assertCrewOwnership(identity, shift.crew_user_id);

    if (shift.status !== 'checked_in') {
      throw new AppError('SHIFT_NOT_CHECKED_IN', 'Shift must be checked in before starting work.', 422);
    }

    const transitionName = this.resolveTransitionName('checked_in', 'in_progress');
    const { shift: updated, event } = await this.runTransition(
      shift,
      'in_progress',
      transitionName,
      this.transitionGuardKeys(transitionName),
      {
        reason: input.reason ?? 'Shift work started',
        idempotencyKey: input.idempotencyKey,
      },
    );

    publishStaffingDomainEvent(
      'shifts.shift_started',
      updated.id,
      { assignmentId: updated.assignment_id, workflowEventId: event.workflow_event_id },
      this.context.requestId,
    );

    return this.toDto(updated, event);
  }

  async checkOut(shiftId: string, input: ShiftAttendanceInput = {}): Promise<ShiftDto> {
    const { identity } = this.requirePlatformSession();
    assertCrewUser(identity);

    const { shift, assignment } = await this.loadShiftContext(shiftId);
    assertCrewOwnership(identity, shift.crew_user_id);

    if (shift.status !== 'in_progress') {
      throw new AppError('SHIFT_NOT_IN_PROGRESS', 'Shift must be in progress to check out.', 422);
    }

    const checkOutAt = input.verifiedAt ?? new Date().toISOString();
    const withCheckOut = await this.getShiftRepository().recordCheckOut(shift.id, checkOutAt);

    const attendanceMetadata = buildAttendanceMetadata({
      checkInAt: withCheckOut.check_in_at ?? undefined,
      checkOutAt,
      startsAt: withCheckOut.starts_at,
      method: input.method,
      evidence: input.evidence,
    });

    const transitionName = this.resolveTransitionName('in_progress', 'completed');
    const { shift: updated, event } = await this.runTransition(
      withCheckOut,
      'completed',
      transitionName,
      this.transitionGuardKeys(transitionName),
      {
        reason: input.reason ?? 'Crew check-out',
        idempotencyKey: input.idempotencyKey,
        supervisorConfirmed: input.supervisorConfirmed,
        attendanceMetadata,
      },
    );

    publishStaffingDomainEvent(
      'shifts.shift_check_out',
      updated.id,
      {
        assignmentId: assignment.id,
        checkOutAt,
        attendance: attendanceMetadata,
        workflowEventId: event.workflow_event_id,
      },
      this.context.requestId,
    );

    publishStaffingDomainEvent(
      'shifts.shift_completed',
      updated.id,
      { assignmentId: assignment.id, workflowEventId: event.workflow_event_id },
      this.context.requestId,
    );

    try {
      await new PaymentService(this.context).orchestrateReleaseAfterShiftCompleted(
        assignment.id,
        updated.id,
        { reason: 'Escrow release after shift completion' },
      );
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : '';
      if (code !== 'PAYMENT_NOT_FUNDED' && code !== 'ESCROW_NOT_FUNDED') {
        throw error;
      }
    }

    return this.toDto(updated, event, attendanceMetadata);
  }

  async markNoShow(shiftId: string, input: ShiftTransitionInput = {}): Promise<ShiftDto> {
    const { identity } = this.requirePlatformSession();
    assertBusinessUser(identity);

    const { shift, assignment } = await this.loadShiftContext(shiftId);

    if (shift.status !== 'scheduled') {
      throw new AppError('SHIFT_NOT_SCHEDULED', 'Only scheduled shifts can be marked no-show.', 422);
    }

    const transitionName = this.resolveTransitionName('scheduled', 'no_show');
    const { shift: updated, event } = await this.runTransition(
      shift,
      'no_show',
      transitionName,
      this.transitionGuardKeys(transitionName),
      {
        reason: input.reason ?? 'Marked no-show',
        idempotencyKey: input.idempotencyKey,
      },
    );

    publishStaffingDomainEvent(
      'shifts.shift_no_show',
      updated.id,
      { assignmentId: assignment.id, workflowEventId: event.workflow_event_id },
      this.context.requestId,
    );

    return this.toDto(updated, event);
  }

  async cancelShift(shiftId: string, input: ShiftTransitionInput = {}): Promise<ShiftDto> {
    const { identity } = this.requirePlatformSession();

    const { shift, assignment } = await this.loadShiftContext(shiftId);

    let transitionName: ShiftTransitionName;
    if (shift.status === 'scheduled') {
      assertBusinessUser(identity);
      transitionName = 'cancel_shift';
    } else if (shift.status === 'checked_in') {
      transitionName = 'cancel_checked_in_shift';
    } else if (shift.status === 'in_progress') {
      transitionName = 'cancel_in_progress_shift';
    } else {
      throw new ConflictError('Shift cannot be cancelled from its current status.');
    }

    const guardKeys = this.transitionGuardKeys(transitionName);
    const { shift: updated, event } = await this.runTransition(shift, 'cancelled', transitionName, guardKeys, {
      reason: input.reason ?? 'Shift cancelled',
      idempotencyKey: input.idempotencyKey,
      incidentRecorded: input.incidentRecorded,
    });

    publishStaffingDomainEvent(
      'shifts.shift_cancelled',
      updated.id,
      { assignmentId: assignment.id, workflowEventId: event.workflow_event_id },
      this.context.requestId,
    );

    return this.toDto(updated, event);
  }

  async getShift(shiftId: string): Promise<ShiftDto> {
    const { identity } = this.requirePlatformSession();
    const shift = await this.getShiftRepository().findById(shiftId);
    if (!shift) throw new NotFoundError('Shift not found.');

    if (identity.role !== 'platform_admin') {
      if (identity.crewUser?.id === shift.crew_user_id) {
        // crew read access
      } else {
        await assertEventCompanyAccess(this.context.supabase, identity, shift.company_profile_id);
      }
    }

    const events = await this.getShiftRepository().listWorkflowEvents(shiftId);
    const last = events.length > 0 ? (events[events.length - 1] as WorkflowTransitionEventRecord) : null;

    const attendance =
      shift.check_in_at || shift.check_out_at
        ? buildAttendanceMetadata({
            checkInAt: shift.check_in_at ?? undefined,
            checkOutAt: shift.check_out_at ?? undefined,
            startsAt: shift.starts_at,
          })
        : null;

    return this.toDto(shift, last, attendance);
  }

  async getShiftTimeline(shiftId: string) {
    await this.getShift(shiftId);
    return this.getShiftRepository().listWorkflowEvents(shiftId);
  }

  async listShiftsByAssignment(assignmentId: string): Promise<ShiftDto[]> {
    const { identity } = this.requirePlatformSession();
    const assignment = await this.getAssignmentRepository().findById(assignmentId);
    if (!assignment) throw new NotFoundError('Assignment not found.');

    if (identity.role !== 'platform_admin') {
      if (identity.crewUser?.id !== assignment.crew_user_id) {
        await assertEventCompanyAccess(this.context.supabase, identity, assignment.company_profile_id);
      }
    }

    const shifts = await this.getShiftRepository().listByAssignmentId(assignmentId);
    return Promise.all(shifts.map((s) => this.getShift(s.id)));
  }
}
