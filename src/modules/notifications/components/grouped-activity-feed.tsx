'use client';

import type { OperationalNotification } from '@/modules/notifications/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';

type GroupedActivityFeedProps = {
  notifications: OperationalNotification[];
  onMarkRead?: (id: string) => void;
  className?: string;
};

function groupLabel(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString();
}

function priorityTone(priority: OperationalNotification['priority']) {
  if (priority === 'urgent') return 'destructive';
  if (priority === 'high') return 'secondary';
  return 'outline';
}

export function GroupedActivityFeed({
  notifications,
  onMarkRead,
  className,
}: GroupedActivityFeedProps) {
  const grouped = notifications.reduce<Record<string, OperationalNotification[]>>((acc, item) => {
    const key = groupLabel(item.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const groups = Object.entries(grouped);

  return (
    <div className={cn('space-y-6', className)}>
      {groups.map(([label, items]) => (
        <section key={label} className="space-y-2">
          <div className="sticky top-0 z-10 bg-background/95 py-1 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          </div>
          <ol className="space-y-2">
            {items.map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  'rounded-xl border p-3 sm:p-4',
                  notification.status === 'unread' ? 'border-primary/40 bg-primary/5' : 'bg-card',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{notification.title}</p>
                    {notification.body ? (
                      <p className="text-sm text-muted-foreground">{notification.body}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityTone(notification.priority)}>{notification.priority}</Badge>
                    {notification.status === 'unread' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => onMarkRead?.(notification.id)}
                      >
                        Mark read
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

