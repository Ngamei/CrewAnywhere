import type { AssignmentStatus } from '@/domain/assignments/status';

export const SHIFT_STATUSES = ['scheduled', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled'] as const;
export type ShiftStatus = (typeof SHIFT_STATUSES)[number];

export const SHIFT_STATUS_TRANSITIONS: Record<ShiftStatus, ShiftStatus[]> = {
  scheduled: ['checked_in', 'no_show', 'cancelled'],
  checked_in: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  no_show: [],
  cancelled: [],
};

export const SHIFT_STATUSES_BY_ASSIGNMENT_STATUS: Record<AssignmentStatus, ShiftStatus[]> = {
  scheduled: ['scheduled'],
  active: ['checked_in', 'in_progress'],
  completed: ['completed'],
  cancelled: ['cancelled', 'no_show'],
};
