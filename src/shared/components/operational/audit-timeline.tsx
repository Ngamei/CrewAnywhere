import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { TransitionIndicator } from './transition-indicator';

export type AuditTimelineEntry = {
  id: string;
  actor?: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  timestamp: string;
  detail?: ReactNode;
};

type AuditTimelineProps = {
  entries: AuditTimelineEntry[];
  className?: string;
};

export function AuditTimeline({ entries, className }: AuditTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      <ol className="space-y-6" aria-label="Audit timeline">
        {entries.map((entry, index) => (
          <li key={entry.id} className="relative pl-8">
            {index < entries.length - 1 ? (
              <span className="absolute left-3 top-6 h-[calc(100%+0.5rem)] w-px bg-border" aria-hidden />
            ) : null}
            <span
              className="absolute left-0 top-1 flex size-6 items-center justify-center rounded-full border border-border bg-card text-xs font-medium"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{entry.action}</p>
                <time className="text-xs text-muted-foreground" dateTime={entry.timestamp}>
                  {entry.timestamp}
                </time>
              </div>
              {entry.actor ? <p className="text-xs text-muted-foreground">By {entry.actor}</p> : null}
              {entry.fromStatus && entry.toStatus ? (
                <TransitionIndicator fromStatus={entry.fromStatus} toStatus={entry.toStatus} />
              ) : null}
              {entry.detail ? <div className="text-sm text-muted-foreground">{entry.detail}</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
