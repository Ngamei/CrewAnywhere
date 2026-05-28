/**
 * Operational notification categories — MVP foundation for in-app awareness.
 * Delivery/push providers wire in later; this layer models types and client state.
 */

export type NotificationCategory =
  | 'activity'
  | 'workflow'
  | 'operational_alert'
  | 'payment'
  | 'shift_reminder'
  | 'proposal'
  | 'hiring'
  | 'assignment'
  | 'onboarding'
  | 'profile';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export type OperationalNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  body?: string;
  href?: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  /** Domain entity reference for deduplication and deep links */
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  source?: 'workflow_event' | 'system';
};

export type NotificationFilter = {
  category?: NotificationCategory;
  status?: NotificationStatus;
};

export type NotificationCounts = Record<NotificationCategory, number> & {
  unread: number;
};
