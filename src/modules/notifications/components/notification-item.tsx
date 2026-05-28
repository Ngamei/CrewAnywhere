'use client';

import Link from 'next/link';
import type { Route } from 'next';
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Bell,
  Clock,
  CreditCard,
  UserCheck,
  UserCircle,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/badge';
import type { NotificationCategory, OperationalNotification } from '@/modules/notifications/types';

const CATEGORY_ICONS: Record<NotificationCategory, LucideIcon> = {
  activity: Activity,
  workflow: Workflow,
  operational_alert: AlertTriangle,
  payment: CreditCard,
  shift_reminder: Clock,
  proposal: Briefcase,
  hiring: UserCheck,
  assignment: Workflow,
  onboarding: UserCheck,
  profile: UserCircle,
};

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  activity: 'Activity',
  workflow: 'Workflow',
  operational_alert: 'Alert',
  payment: 'Payment',
  shift_reminder: 'Shift',
  proposal: 'Proposal',
  hiring: 'Hiring',
  assignment: 'Assignment',
  onboarding: 'Onboarding',
  profile: 'Profile',
};

type NotificationItemProps = {
  notification: OperationalNotification;
  onRead?: (id: string) => void;
  className?: string;
};

export function NotificationItem({ notification, onRead, className }: NotificationItemProps) {
  const Icon = CATEGORY_ICONS[notification.category] ?? Bell;
  const isUnread = notification.status === 'unread';

  const content = (
    <div
      className={cn(
        'flex gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        isUnread ? 'bg-accent/50' : 'hover:bg-accent/30',
        className,
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
          notification.priority === 'urgent' || notification.priority === 'high'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted text-muted-foreground',
        )}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className={cn('text-sm leading-snug', isUnread && 'font-medium')}>{notification.title}</p>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {CATEGORY_LABELS[notification.category]}
          </Badge>
        </div>
        {notification.body ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
        ) : null}
        <time className="text-[10px] text-muted-foreground" dateTime={notification.createdAt}>
          {new Date(notification.createdAt).toLocaleString()}
        </time>
      </div>
      {isUnread ? (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
      ) : null}
    </div>
  );

  if (notification.href) {
    return (
      <Link
        href={notification.href as Route}
        className="block"
        onClick={() => onRead?.(notification.id)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="block w-full"
      onClick={() => onRead?.(notification.id)}
    >
      {content}
    </button>
  );
}
