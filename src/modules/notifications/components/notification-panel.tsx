'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Radio } from 'lucide-react';
import { NotificationItem } from '@/modules/notifications/components/notification-item';
import { useNotificationRealtimeSubscription, useNotifications } from '@/modules/notifications/hooks';
import type { NotificationCategory } from '@/modules/notifications/types';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';
import { isPlatformSessionPayload } from '@/shared/auth/types';

const TAB_CATEGORIES: Array<{ value: 'all' | NotificationCategory; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'activity', label: 'Activity' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'operational_alert', label: 'Alerts' },
  { value: 'payment', label: 'Payments' },
  { value: 'shift_reminder', label: 'Shifts' },
  { value: 'proposal', label: 'Proposals' },
  { value: 'assignment', label: 'Assignments' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'profile', label: 'Profile' },
];

export function NotificationPanel() {
  const [tab, setTab] = useState<string>('all');
  const { data: session } = usePlatformSession();
  const role = session && isPlatformSessionPayload(session) ? session.identity.role : undefined;
  const { connectionState } = useNotificationRealtimeSubscription({ enabled: true, role });
  const { notifications, markRead, markAllRead } = useNotifications();

  const filtered = useMemo(() => {
    if (tab === 'all') return notifications;
    return notifications.filter((n) => n.category === tab);
  }, [notifications, tab]);

  return (
    <div className="flex w-[min(100vw-2rem,22rem)] flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Radio className="size-3" />
            {connectionState === 'live' ? 'Live' : 'Syncing'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => markAllRead(tab === 'all' ? undefined : (tab as NotificationCategory))}
          disabled={filtered.every((n) => n.status !== 'unread')}
        >
          Mark all read
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col">
        <TabsList className="mx-2 mt-2 h-auto w-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {TAB_CATEGORIES.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="h-7 rounded-md px-2 text-xs data-[state=active]:bg-accent"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-0 flex-1">
          <ScrollArea className="h-[min(24rem,50vh)]">
            {filtered.length === 0 ? (
              <OperationalEmptyState
                variant="notifications"
                title="You're all caught up"
                description="Activity, workflow, payment, and shift notifications will appear here."
                className="m-3 border-0 bg-transparent"
              />
            ) : (
              <div className="space-y-0.5 p-2">
                {filtered.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markRead}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="border-t p-2">
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href={'/dashboard/notifications' as Route}>Open notification center</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
