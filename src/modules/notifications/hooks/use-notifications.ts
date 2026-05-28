'use client';

import { useCallback, useMemo } from 'react';
import {
  buildActivityNotification,
  buildOperationalAlertNotification,
  buildPaymentNotification,
  buildShiftReminderNotification,
  buildWorkflowNotification,
} from '@/modules/notifications/hooks/notification-builders';
import { useNotificationStore } from '@/modules/notifications/state/notification-store';
import type { NotificationCategory, NotificationFilter } from '@/modules/notifications/types';
import { useOperationalRefresh } from '@/shared/hooks/use-operational-refresh';
import { isPlatformSessionPayload } from '@/shared/auth/types';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';
import { queryKeys } from '@/shared/state/query-keys';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  activity: 'Activity',
  workflow: 'Workflow',
  operational_alert: 'Alerts',
  payment: 'Payments',
  shift_reminder: 'Shift reminders',
  proposal: 'Proposals',
  hiring: 'Hiring',
  assignment: 'Assignments',
  onboarding: 'Onboarding',
  profile: 'Profile',
};

function canRoleSeeCategory(category: NotificationCategory, role: string | undefined): boolean {
  if (!role || role === 'platform_admin') return true;
  if (role === 'crew') {
    return [
      'activity',
      'workflow',
      'payment',
      'shift_reminder',
      'proposal',
      'assignment',
      'onboarding',
      'profile',
    ].includes(category);
  }
  return [
    'activity',
    'workflow',
    'operational_alert',
    'payment',
    'shift_reminder',
    'proposal',
    'hiring',
    'assignment',
    'profile',
  ].includes(category);
}

export function useNotifications(filter?: NotificationFilter) {
  const { data: session } = usePlatformSession();
  const role = session && isPlatformSessionPayload(session) ? session.identity.role : undefined;
  const notifications = useNotificationStore((state) => state.notifications);
  const push = useNotificationStore((state) => state.push);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const archive = useNotificationStore((state) => state.archive);
  const clear = useNotificationStore((state) => state.clear);
  const { invalidate } = useOperationalRefresh();

  const items = useMemo(() => {
    return notifications.filter((n) => {
      if (n.status === 'archived') return false;
      if (!canRoleSeeCategory(n.category, role)) return false;
      if (filter?.category && n.category !== filter.category) return false;
      if (filter?.status && n.status !== filter.status) return false;
      return true;
    });
  }, [notifications, filter, role]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.status === 'unread' &&
          canRoleSeeCategory(n.category, role) &&
          (!filter?.category || n.category === filter.category),
      ).length,
    [notifications, filter, role],
  );

  const pushAndInvalidate = useCallback(
    (notification: ReturnType<typeof buildActivityNotification>) => {
      push(notification);
      invalidate(queryKeys.notifications.unreadCount);
    },
    [push, invalidate],
  );

  return {
    notifications: items,
    unreadCount,
    categoryLabels: CATEGORY_LABELS,
    markRead,
    markAllRead,
    archive,
    clear,
    notifyActivity: (input: Parameters<typeof buildActivityNotification>[0]) =>
      pushAndInvalidate(buildActivityNotification(input)),
    notifyWorkflow: (input: Parameters<typeof buildWorkflowNotification>[0]) =>
      pushAndInvalidate(buildWorkflowNotification(input)),
    notifyOperationalAlert: (input: Parameters<typeof buildOperationalAlertNotification>[0]) =>
      pushAndInvalidate(buildOperationalAlertNotification(input)),
    notifyPayment: (input: Parameters<typeof buildPaymentNotification>[0]) =>
      pushAndInvalidate(buildPaymentNotification(input)),
    notifyShiftReminder: (input: Parameters<typeof buildShiftReminderNotification>[0]) =>
      pushAndInvalidate(buildShiftReminderNotification(input)),
  };
}
