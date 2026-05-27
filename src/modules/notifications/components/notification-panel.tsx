'use client';

import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { NotificationItem } from '@/modules/notifications/components/notification-item';
import { useNotifications } from '@/modules/notifications/hooks';
import type { NotificationCategory } from '@/modules/notifications/types';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';

const TAB_CATEGORIES: Array<{ value: 'all' | NotificationCategory; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'activity', label: 'Activity' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'operational_alert', label: 'Alerts' },
  { value: 'payment', label: 'Payments' },
  { value: 'shift_reminder', label: 'Shifts' },
];

export function NotificationPanel() {
  const [tab, setTab] = useState<string>('all');
  const { notifications, markRead, markAllRead } = useNotifications();

  const filtered = useMemo(() => {
    if (tab === 'all') return notifications;
    return notifications.filter((n) => n.category === tab);
  }, [notifications, tab]);

  return (
    <div className="flex w-[min(100vw-2rem,22rem)] flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-sm font-semibold">Notifications</p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
