'use client';

import { GroupedActivityFeed } from '@/modules/notifications/components';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { useNotificationRealtimeSubscription, useNotifications } from '@/modules/notifications/hooks';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';
import { isPlatformSessionPayload } from '@/shared/auth/types';
import { Badge } from '@/shared/ui/badge';
import { Radio } from 'lucide-react';

export default function ActivityFoundationPage() {
  const { data: session } = usePlatformSession();
  const role = session && isPlatformSessionPayload(session) ? session.identity.role : undefined;
  const { connectionState } = useNotificationRealtimeSubscription({ enabled: true, role });
  const { notifications, markRead } = useNotifications();
  const feedItems = notifications.filter((n) =>
    ['activity', 'workflow', 'proposal', 'hiring', 'assignment', 'payment', 'shift_reminder'].includes(
      n.category,
    ),
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
        <h2 className="text-2xl font-semibold tracking-tight">Activity</h2>
        <p className="text-sm text-muted-foreground">
            Grouped operational timeline across proposals, hiring, shifts, assignments, and payments.
        </p>
        </div>
        <Badge variant={connectionState === 'live' ? 'default' : 'secondary'} className="gap-1">
          <Radio className="size-3.5" />
          {connectionState === 'live' ? 'Realtime live' : 'Realtime syncing'}
        </Badge>
      </div>

      {feedItems.length === 0 ? (
        <OperationalEmptyState
          variant="activity"
          title="No activity yet"
          description="Workflow transitions, assignments, and marketplace events will appear here."
        />
      ) : (
        <GroupedActivityFeed notifications={feedItems.slice(0, 80)} onMarkRead={markRead} />
      )}
    </section>
  );
}
