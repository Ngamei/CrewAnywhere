import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import type {
  ScheduleShiftInput,
  ShiftAttendanceInput,
  ShiftTransitionInput,
} from '@/modules/shifts/schemas';
import { ShiftService } from '@/modules/shifts/services';

export async function scheduleShiftFromAssignment(
  context: AuthenticatedServiceContext,
  assignmentId: string,
  input?: ScheduleShiftInput,
) {
  return new ShiftService(context).scheduleFromAssignment(assignmentId, input);
}

export async function getShift(context: AuthenticatedServiceContext, shiftId: string) {
  return new ShiftService(context).getShift(shiftId);
}

export async function listShiftsForAssignment(
  context: AuthenticatedServiceContext,
  assignmentId: string,
) {
  return new ShiftService(context).listShiftsByAssignment(assignmentId);
}

export async function getShiftTimeline(context: AuthenticatedServiceContext, shiftId: string) {
  return new ShiftService(context).getShiftTimeline(shiftId);
}

export async function checkInShift(
  context: AuthenticatedServiceContext,
  shiftId: string,
  input?: ShiftAttendanceInput,
) {
  return new ShiftService(context).checkIn(shiftId, input);
}

export async function startShift(
  context: AuthenticatedServiceContext,
  shiftId: string,
  input?: ShiftTransitionInput,
) {
  return new ShiftService(context).startShift(shiftId, input);
}

export async function checkOutShift(
  context: AuthenticatedServiceContext,
  shiftId: string,
  input?: ShiftAttendanceInput,
) {
  return new ShiftService(context).checkOut(shiftId, input);
}

export async function markShiftNoShow(
  context: AuthenticatedServiceContext,
  shiftId: string,
  input?: ShiftTransitionInput,
) {
  return new ShiftService(context).markNoShow(shiftId, input);
}

export async function cancelShift(
  context: AuthenticatedServiceContext,
  shiftId: string,
  input?: ShiftTransitionInput,
) {
  return new ShiftService(context).cancelShift(shiftId, input);
}
