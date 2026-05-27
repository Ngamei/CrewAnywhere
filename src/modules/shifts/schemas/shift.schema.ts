import { z } from 'zod';
import { shiftStatusEnum } from '@/shared/state/enums/shift-status';

export const shiftIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const assignmentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const scheduleShiftSchema = z.object({
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  supervisorBusinessUserId: z.string().uuid().optional(),
  reason: z.string().trim().min(1).max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const shiftAttendanceSchema = z.object({
  method: z.enum(['qr', 'gps', 'supervisor', 'manual']).optional(),
  verifiedAt: z.string().datetime().optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
  reason: z.string().trim().min(1).max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  supervisorConfirmed: z.boolean().optional(),
  incidentRecorded: z.boolean().optional(),
});

export const shiftTransitionSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  supervisorConfirmed: z.boolean().optional(),
  incidentRecorded: z.boolean().optional(),
});

export const shiftStatusFilterSchema = z.object({
  status: shiftStatusEnum.schema.optional(),
});

export type ScheduleShiftInput = z.infer<typeof scheduleShiftSchema>;
export type ShiftAttendanceInput = z.infer<typeof shiftAttendanceSchema>;
export type ShiftTransitionInput = z.infer<typeof shiftTransitionSchema>;
