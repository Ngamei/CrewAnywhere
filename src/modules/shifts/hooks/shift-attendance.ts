import type { AttendanceMetadata } from '@/modules/shifts/types';

const DEFAULT_WINDOW_MINUTES_BEFORE = 30;
const DEFAULT_WINDOW_MINUTES_AFTER = 15;
const DEFAULT_LATE_GRACE_MINUTES = 5;

function parseEnvMinutes(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getAttendanceWindowMinutesBefore(): number {
  return parseEnvMinutes('CREWANYWHERE_ATTENDANCE_WINDOW_MINUTES_BEFORE', DEFAULT_WINDOW_MINUTES_BEFORE);
}

export function getAttendanceWindowMinutesAfter(): number {
  return parseEnvMinutes('CREWANYWHERE_ATTENDANCE_WINDOW_MINUTES_AFTER', DEFAULT_WINDOW_MINUTES_AFTER);
}

export function getLateGraceMinutes(): number {
  return parseEnvMinutes('CREWANYWHERE_LATE_GRACE_MINUTES', DEFAULT_LATE_GRACE_MINUTES);
}

export function isAttendanceWindowOpen(startsAt: string, now: Date = new Date()): boolean {
  const start = new Date(startsAt).getTime();
  const windowStart = start - getAttendanceWindowMinutesBefore() * 60_000;
  const windowEnd = start + getAttendanceWindowMinutesAfter() * 60_000;
  const ts = now.getTime();
  return ts >= windowStart && ts <= windowEnd;
}

export function isAttendanceWindowExpired(startsAt: string, now: Date = new Date()): boolean {
  const start = new Date(startsAt).getTime();
  const windowEnd = start + getAttendanceWindowMinutesAfter() * 60_000;
  return now.getTime() > windowEnd;
}

/** Foundation late detection — true when check-in is after scheduled start + grace. */
export function detectLateCheckIn(
  checkInAt: string,
  startsAt: string,
  graceMinutes = getLateGraceMinutes(),
): { isLate: boolean; lateMinutes: number } {
  const startMs = new Date(startsAt).getTime();
  const checkInMs = new Date(checkInAt).getTime();
  const graceMs = graceMinutes * 60_000;
  const lateMs = checkInMs - (startMs + graceMs);
  if (lateMs <= 0) {
    return { isLate: false, lateMinutes: 0 };
  }
  return { isLate: true, lateMinutes: Math.ceil(lateMs / 60_000) };
}

export function buildAttendanceMetadata(input: {
  checkInAt?: string;
  checkOutAt?: string;
  startsAt: string;
  method?: AttendanceMetadata['method'];
  evidence?: Record<string, unknown>;
}): AttendanceMetadata {
  const metadata: AttendanceMetadata = {
    method: input.method,
    evidence: input.evidence,
  };

  if (input.checkInAt) {
    const late = detectLateCheckIn(input.checkInAt, input.startsAt);
    metadata.verifiedAt = input.checkInAt;
    metadata.isLate = late.isLate;
    metadata.lateMinutes = late.lateMinutes;
  }

  if (input.checkOutAt) {
    metadata.verifiedAt = input.checkOutAt;
  }

  return metadata;
}
