import type { WorkflowTransitionEventRecord } from '@/backend/services/workflow';
import type { ShiftRecord } from './shift-records';

export type AttendanceMetadata = {
  method?: 'qr' | 'gps' | 'supervisor' | 'manual';
  evidence?: Record<string, unknown>;
  verifiedAt?: string;
  isLate?: boolean;
  lateMinutes?: number;
};

export type ShiftDto = ShiftRecord & {
  lastTransition: WorkflowTransitionEventRecord | null;
  attendance: AttendanceMetadata | null;
};

export type ShiftListItemDto = {
  id: string;
  assignment_id: string;
  event_id: string;
  job_id: string;
  crew_user_id: string;
  status: ShiftRecord['status'];
  starts_at: string;
  ends_at: string;
  check_in_at: string | null;
  check_out_at: string | null;
  updated_at: string;
};

export type ShiftDetailDto = ShiftListItemDto & {
  company_profile_id: string;
  supervisor_business_user_id: string | null;
  status_version: number;
};
