import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
  Activity,
  Briefcase,
  Bell,
  CalendarDays,
  ClipboardList,
  Clock,
  CreditCard,
  Inbox,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export type OperationalEmptyStateVariant =
  | 'default'
  | 'activity'
  | 'events'
  | 'jobs'
  | 'proposals'
  | 'shifts'
  | 'payments'
  | 'profile'
  | 'notifications'
  | 'marketplace';

const VARIANT_ICONS: Record<OperationalEmptyStateVariant, LucideIcon> = {
  default: Inbox,
  activity: Activity,
  events: CalendarDays,
  jobs: Briefcase,
  proposals: ClipboardList,
  shifts: Clock,
  payments: CreditCard,
  profile: UserCircle,
  notifications: Bell,
  marketplace: Briefcase,
};

type OperationalEmptyStateProps = {
  variant?: OperationalEmptyStateVariant;
  title: string;
  description?: string;
  action?: ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  /** Navigates via Next.js Link when set (preferred over onAction for route CTAs). */
  actionHref?: Route;
  className?: string;
};

export function OperationalEmptyState({
  variant = 'default',
  title,
  description,
  action,
  onAction,
  actionLabel,
  actionHref,
  className,
}: OperationalEmptyStateProps) {
  const Icon = VARIANT_ICONS[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center',
        className,
      )}
      role="status"
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ??
        (actionHref && actionLabel ? (
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : onAction && actionLabel ? (
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null)}
    </div>
  );
}
