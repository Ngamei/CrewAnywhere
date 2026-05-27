import { ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { WorkflowStatusBadge } from './workflow-status-badge';

type TransitionIndicatorProps = {
  fromStatus: string;
  toStatus: string;
  label?: string;
  className?: string;
};

export function TransitionIndicator({ fromStatus, toStatus, label, className }: TransitionIndicatorProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="group"
      aria-label={label ?? `Transition from ${fromStatus} to ${toStatus}`}
    >
      <WorkflowStatusBadge status={fromStatus} />
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <WorkflowStatusBadge status={toStatus} />
    </div>
  );
}
