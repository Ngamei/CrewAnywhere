import type { Route } from 'next';
import type { WorkflowEventPayload } from '@/shared/events';
import type {
  NotificationCategory,
  NotificationPriority,
  OperationalNotification,
} from '@/modules/notifications/types';
import {
  buildOperationalAlertNotification,
  buildPaymentNotification,
  buildShiftReminderNotification,
  buildWorkflowNotification,
} from './notification-builders';

type NotificationMapping = {
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  href: Route;
};

type RoleScope = 'crew' | 'business' | 'platform_admin';

function resolveRoleScope(role: string | undefined): RoleScope {
  if (role === 'crew') return 'crew';
  if (role === 'platform_admin') return 'platform_admin';
  return 'business';
}

function inferSeverity(payload: WorkflowEventPayload): NotificationPriority {
  const to = payload.to_status.toLowerCase();
  if (to.includes('failed') || to.includes('rejected') || to.includes('blocked')) return 'urgent';
  if (to.includes('cancelled') || to.includes('expired')) return 'high';
  if (to.includes('pending')) return 'normal';
  return 'low';
}

function mapWorkflowEvent(payload: WorkflowEventPayload): NotificationMapping {
  const severity = inferSeverity(payload);
  const fallbackBody = payload.from_status
    ? `${payload.from_status} -> ${payload.to_status} via ${payload.transition_source}`
    : `Moved to ${payload.to_status} via ${payload.transition_source}`;

  switch (payload.entity_type) {
    case 'proposal':
      return {
        category: 'proposal',
        priority: severity,
        title: `Proposal ${payload.to_status}`,
        body: fallbackBody,
        href: '/dashboard/proposals' as Route,
      };
    case 'assignment':
      return {
        category: 'assignment',
        priority: severity,
        title: `Assignment ${payload.to_status}`,
        body: fallbackBody,
        href: '/dashboard/workflows' as Route,
      };
    case 'hiring':
      return {
        category: 'hiring',
        priority: severity,
        title: `Hiring ${payload.to_status}`,
        body: fallbackBody,
        href: '/dashboard/workflows' as Route,
      };
    case 'shift':
      return {
        category: 'shift_reminder',
        priority: severity === 'urgent' ? 'urgent' : 'high',
        title: `Shift ${payload.to_status}`,
        body: fallbackBody,
        href: '/dashboard/shifts' as Route,
      };
    case 'payment':
      return {
        category: 'payment',
        priority: severity,
        title: `Payment ${payload.to_status}`,
        body: fallbackBody,
        href: '/dashboard/payments' as Route,
      };
    case 'withdrawal':
      return {
        category: 'payment',
        priority: severity,
        title: `Withdrawal ${payload.to_status}`,
        body: fallbackBody,
        href: '/dashboard/wallet' as Route,
      };
    case 'onboarding':
      return {
        category: 'onboarding',
        priority: severity,
        title: `Onboarding ${payload.to_status}`,
        body: fallbackBody,
        href: '/onboarding' as Route,
      };
    case 'profile':
      return {
        category: 'profile',
        priority: severity,
        title: `Profile readiness ${payload.to_status}`,
        body: fallbackBody,
        href: '/dashboard/profile' as Route,
      };
    default:
      return {
        category: 'workflow',
        priority: severity,
        title: `${payload.entity_type} ${payload.to_status}`,
        body: fallbackBody,
        href: '/dashboard/workflows' as Route,
      };
  }
}

export function mapWorkflowPayloadToNotification(
  payload: WorkflowEventPayload,
): OperationalNotification {
  const mapping = mapWorkflowEvent(payload);
  const sharedInput = {
    title: mapping.title,
    body: mapping.body,
    href: mapping.href,
    priority: mapping.priority,
    entityType: payload.entity_type,
    entityId: payload.entity_id,
    source: 'workflow_event' as const,
    metadata: {
      workflowEventId: payload.workflow_event_id,
      toStatus: payload.to_status,
      fromStatus: payload.from_status,
      transitionSource: payload.transition_source,
      createdAt: payload.created_at,
    },
  };

  if (mapping.category === 'payment') {
    return buildPaymentNotification(sharedInput);
  }

  if (mapping.category === 'shift_reminder') {
    return buildShiftReminderNotification({
      ...sharedInput,
      shiftId: payload.entity_id,
      reminderType: 'upcoming',
    });
  }

  if (mapping.priority === 'urgent') {
    return buildOperationalAlertNotification(sharedInput);
  }

  return buildWorkflowNotification(sharedInput);
}

export function canRoleSeeEntityType(entityType: string, role: string | undefined): boolean {
  const scope = resolveRoleScope(role);
  if (scope === 'platform_admin') return true;
  if (scope === 'crew') {
    return ['assignment', 'shift', 'payment', 'withdrawal', 'onboarding', 'profile', 'proposal'].includes(
      entityType,
    );
  }
  return ['proposal', 'hiring', 'assignment', 'shift', 'payment', 'withdrawal', 'profile'].includes(
    entityType,
  );
}

