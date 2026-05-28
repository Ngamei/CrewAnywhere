'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Bell, Filter, Radio } from 'lucide-react';
import { GroupedActivityFeed } from '@/modules/notifications/components/grouped-activity-feed';
import { useNotifications, useNotificationRealtimeSubscription } from '@/modules/notifications/hooks';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { isPlatformSessionPayload } from '@/shared/auth/types';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import type { NotificationCategory } from '@/modules/notifications/types';

const FILTERS: Array<{ value: 'all' | NotificationCategory; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'proposal', label: 'Proposals' },
  { value: 'assignment', label: 'Assignments' },
  { value: 'shift_reminder', label: 'Shifts' },
  { value: 'payment', label: 'Payments' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'profile', label: 'Profile' },
  { value: 'operational_alert', label: 'Alerts' },
];

export function NotificationCenterScreen() {
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationCategory>('all');
  const { data: session } = usePlatformSession();
  const role = session && isPlatformSessionPayload(session) ? session.identity.role : undefined;
  const { connectionState } = useNotificationRealtimeSubscription({ enabled: true, role });
  const { notifications, markRead, markAllRead } = useNotifications();

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((item) => item.category === activeFilter);
  }, [activeFilter, notifications]);

  const unreadCount = filtered.filter((n) => n.status === 'unread').length;

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Notification Center</h2>
          <p className="text-sm text-muted-foreground">
            Realtime operational activity, alerts, and workflow visibility for your role.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connectionState === 'live' ? 'default' : 'secondary'} className="gap-1">
            <Radio className="size-3.5" />
            {connectionState === 'live' ? 'Live updates' : 'Reconnecting'}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => markAllRead(activeFilter === 'all' ? undefined : activeFilter)}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        </div>
      </div>

      <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as typeof activeFilter)}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {FILTERS.map((filter) => (
            <TabsTrigger
              key={filter.value}
              value={filter.value}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs data-[state=active]:bg-accent"
            >
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Filter className="size-3.5" />
        {activeFilter === 'all' ? 'Showing all activity types' : `Filtered by ${activeFilter}`}
        {unreadCount > 0 ? <span>• {unreadCount} unread</span> : null}
      </div>

      {filtered.length === 0 ? (
        <OperationalEmptyState
          variant="notifications"
          title="No notifications yet"
          description="New proposal, assignment, shift, payment, and onboarding updates will appear in realtime."
          action={
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href={'/dashboard/activity' as Route}>Open activity dashboard</Link>
            </Button>
          }
        />
      ) : (
        <GroupedActivityFeed notifications={filtered} onMarkRead={markRead} />
      )}

      <div className="flex justify-end">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href={'/dashboard/activity' as Route}>
            <Bell className="size-4" />
            Open activity view
          </Link>
        </Button>
      </div>
    </section>
  );
}

