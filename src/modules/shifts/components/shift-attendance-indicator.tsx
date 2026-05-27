import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/cn';
import type { ShiftStatus } from '@/shared/state/enums/shift-status';

type AttendanceTone = 'pending' | 'present' | 'active' | 'complete' | 'absent' | 'cancelled';

const attendanceByStatus: Record<
  ShiftStatus,
  { label: string; tone: AttendanceTone; detail: string }
> = {
  scheduled: {
    label: 'Awaiting check-in',
    tone: 'pending',
    detail: 'Attendance window not yet confirmed.',
  },
  checked_in: {
    label: 'Checked in',
    tone: 'present',
    detail: 'Crew is on site and verified.',
  },
  in_progress: {
    label: 'On shift',
    tone: 'active',
    detail: 'Work is in progress.',
  },
  completed: {
    label: 'Shift complete',
    tone: 'complete',
    detail: 'Checkout and supervisor confirmation recorded.',
  },
  no_show: {
    label: 'No show',
    tone: 'absent',
    detail: 'Attendance window expired without check-in.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'cancelled',
    detail: 'Shift will not be fulfilled.',
  },
};

const toneClasses: Record<AttendanceTone, string> = {
  pending: 'border-warning/40 bg-warning/10 text-warning',
  present: 'border-info/40 bg-info/10 text-info',
  active: 'border-primary/40 bg-primary/10 text-primary',
  complete: 'border-success/40 bg-success/10 text-success',
  absent: 'border-destructive/40 bg-destructive/10 text-destructive',
  cancelled: 'border-muted-foreground/30 bg-muted text-muted-foreground',
};

type ShiftAttendanceIndicatorProps = {
  status: ShiftStatus;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  className?: string;
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString();
}

export function ShiftAttendanceIndicator({
  status,
  checkInAt,
  checkOutAt,
  className,
}: ShiftAttendanceIndicatorProps) {
  const attendance = attendanceByStatus[status];
  const checkInLabel = formatTimestamp(checkInAt);
  const checkOutLabel = formatTimestamp(checkOutAt);

  return (
    <div className={cn('space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Attendance</p>
          <p className="text-xs text-muted-foreground">{attendance.detail}</p>
        </div>
        <Badge variant="outline" className={cn('font-medium', toneClasses[attendance.tone])}>
          {attendance.label}
        </Badge>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between rounded-md border px-3 py-2">
          <dt className="text-muted-foreground">Check-in</dt>
          <dd className="font-medium">{checkInLabel ?? '—'}</dd>
        </div>
        <div className="flex justify-between rounded-md border px-3 py-2">
          <dt className="text-muted-foreground">Check-out</dt>
          <dd className="font-medium">{checkOutLabel ?? '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
