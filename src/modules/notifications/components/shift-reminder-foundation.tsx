'use client';

import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { useNotifications } from '@/modules/notifications/hooks';

type ShiftReminderFoundationProps = {
  shiftId: string;
  shiftLabel: string;
  startsAt: string;
  /** Minutes before shift start to surface reminder (foundation default). */
  reminderLeadMinutes?: number;
};

/**
 * Shift reminder foundation — schedules in-app reminders; push/email delivery wires later.
 */
export function ShiftReminderFoundation({
  shiftId,
  shiftLabel,
  startsAt,
  reminderLeadMinutes = 60,
}: ShiftReminderFoundationProps) {
  const { notifyShiftReminder } = useNotifications();

  const scheduleReminder = () => {
    notifyShiftReminder({
      shiftId,
      title: `Upcoming shift: ${shiftLabel}`,
      body: `Starts at ${new Date(startsAt).toLocaleString()} — check in ${reminderLeadMinutes} min before.`,
      reminderType: 'upcoming',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            <div>
              <CardTitle className="text-base">Shift reminders</CardTitle>
              <CardDescription>
                In-app reminder foundation — {reminderLeadMinutes} min lead time.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline">Foundation</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{shiftLabel}</span> ·{' '}
          {new Date(startsAt).toLocaleString()}
        </p>
        <button
          type="button"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={scheduleReminder}
        >
          Preview reminder notification
        </button>
      </CardContent>
    </Card>
  );
}
