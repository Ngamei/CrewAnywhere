import type {
  NotificationCategory,
  NotificationPriority,
  OperationalNotification,
} from '@/modules/notifications/types';

function createId() {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type BuildNotificationInput = {
  category: NotificationCategory;
  title: string;
  body?: string;
  href?: string;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

function buildNotification(input: BuildNotificationInput): OperationalNotification {
  return {
    id: createId(),
    category: input.category,
    title: input.title,
    body: input.body,
    href: input.href,
    priority: input.priority ?? 'normal',
    status: 'unread',
    createdAt: new Date().toISOString(),
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
  };
}

/** Activity feed items (assignments, proposals, marketplace). */
export function buildActivityNotification(
  input: Omit<BuildNotificationInput, 'category'>,
): OperationalNotification {
  return buildNotification({ ...input, category: 'activity' });
}

/** Workflow lifecycle transitions (hire, publish, shift state). */
export function buildWorkflowNotification(
  input: Omit<BuildNotificationInput, 'category'>,
): OperationalNotification {
  return buildNotification({ ...input, category: 'workflow', priority: input.priority ?? 'normal' });
}

/** Operational alerts (SLA, attendance, reconciliation). */
export function buildOperationalAlertNotification(
  input: Omit<BuildNotificationInput, 'category'>,
): OperationalNotification {
  return buildNotification({
    ...input,
    category: 'operational_alert',
    priority: input.priority ?? 'high',
  });
}

/** Payment and wallet events (escrow, payout, reconciliation). */
export function buildPaymentNotification(
  input: Omit<BuildNotificationInput, 'category'>,
): OperationalNotification {
  return buildNotification({ ...input, category: 'payment' });
}

/** Shift reminders — foundation for scheduled nudges before check-in. */
export function buildShiftReminderNotification(
  input: Omit<BuildNotificationInput, 'category'> & {
    shiftId: string;
    reminderType?: 'upcoming' | 'check_in_due' | 'check_out_due';
  },
): OperationalNotification {
  const { shiftId, reminderType = 'upcoming', ...rest } = input;
  return buildNotification({
    ...rest,
    category: 'shift_reminder',
    entityType: 'shift',
    entityId: shiftId,
    href: rest.href ?? `/dashboard/shifts/${shiftId}`,
    metadata: { reminderType, ...rest.metadata },
    priority: rest.priority ?? 'high',
  });
}
