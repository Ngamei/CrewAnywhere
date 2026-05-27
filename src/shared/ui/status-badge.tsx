import type { ReactNode } from 'react';
import { Badge, type BadgeProps } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/cn';

type StatusBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'pending';

const toneToVariant: Record<StatusBadgeTone, NonNullable<BadgeProps['variant']>> = {
  neutral: 'muted',
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  info: 'secondary',
  pending: 'outline',
};

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
};

/** @deprecated Prefer WorkflowStatusBadge for workflow entity statuses. */
export function StatusBadge({ children, tone = 'neutral', className }: StatusBadgeProps) {
  return (
    <Badge variant={toneToVariant[tone]} className={cn(className)}>
      {children}
    </Badge>
  );
}
