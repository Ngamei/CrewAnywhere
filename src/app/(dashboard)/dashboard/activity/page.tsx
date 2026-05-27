'use client';

import { ActivityFeed } from '@/shared/components/operational/activity-feed';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { useNotifications } from '@/modules/notifications/hooks';

export default function ActivityFoundationPage() {
  const { notifications } = useNotifications();

  const feedItems = notifications
    .filter((n) => n.category === 'activity' || n.category === 'workflow')
    .slice(0, 20)
    .map((n) => ({
      id: n.id,
      title: n.title,
      description: n.body,
      timestamp: new Date(n.createdAt).toLocaleString(),
    }));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Activity</h2>
        <p className="text-sm text-muted-foreground">
          Operational activity awareness — feeds sync with in-app notifications.
        </p>
      </div>

      {feedItems.length === 0 ? (
        <OperationalEmptyState
          variant="activity"
          title="No activity yet"
          description="Workflow transitions, assignments, and marketplace events will appear here."
        />
      ) : (
        <ActivityFeed items={feedItems} />
      )}
    </section>
  );
}
