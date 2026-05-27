import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Skeleton } from '@/shared/ui/skeleton';

export type ActivityFeedItem = {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  meta?: ReactNode;
};

type ActivityFeedProps = {
  items: ActivityFeedItem[];
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
};

export function ActivityFeed({
  items,
  emptyMessage = 'No recent activity.',
  isLoading = false,
  className,
}: ActivityFeedProps) {
  if (isLoading) {
    return <ActivityFeedSkeleton className={className} />;
  }

  if (items.length === 0) {
    return (
      <p className={cn('rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground', className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ScrollArea className={cn('h-full max-h-[28rem]', className)}>
      <ol className="space-y-0" aria-label="Activity feed">
        {items.map((item, index) => (
          <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
            {index < items.length - 1 ? (
              <span className="absolute left-[0.4375rem] top-3 h-[calc(100%-0.5rem)] w-px bg-border" aria-hidden />
            ) : null}
            <span className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={item.timestamp}>
                  {item.timestamp}
                </time>
              </div>
              {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
              {item.meta ? <div className="pt-1">{item.meta}</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </ScrollArea>
  );
}

export function ActivityFeedSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)} aria-busy aria-label="Loading activity">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-2 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
