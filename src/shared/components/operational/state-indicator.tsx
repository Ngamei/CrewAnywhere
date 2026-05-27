import { cn } from '@/shared/lib/cn';

type StateIndicatorVariant = 'idle' | 'live' | 'syncing' | 'error' | 'offline';

const variantStyles: Record<StateIndicatorVariant, { dot: string; label: string }> = {
  idle: { dot: 'bg-muted-foreground', label: 'Idle' },
  live: { dot: 'bg-success animate-pulse', label: 'Live' },
  syncing: { dot: 'bg-info animate-pulse', label: 'Syncing' },
  error: { dot: 'bg-destructive', label: 'Error' },
  offline: { dot: 'bg-muted-foreground/50', label: 'Offline' },
};

type StateIndicatorProps = {
  variant: StateIndicatorVariant;
  label?: string;
  className?: string;
};

export function StateIndicator({ variant, label, className }: StateIndicatorProps) {
  const styles = variantStyles[variant];
  const displayLabel = label ?? styles.label;

  return (
    <span className={cn('inline-flex items-center gap-2 text-xs font-medium text-muted-foreground', className)}>
      <span className={cn('size-2 rounded-full', styles.dot)} aria-hidden />
      <span>{displayLabel}</span>
    </span>
  );
}
