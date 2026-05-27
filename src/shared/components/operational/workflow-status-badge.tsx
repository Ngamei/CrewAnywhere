import type { WorkflowEntityType } from '@/shared/state/enums/workflow-entity-type';
import type { AnyWorkflowEntityStatus } from '@/shared/state/types/workflow-entity-status';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/cn';
import { formatWorkflowStatusLabel, resolveWorkflowStatusTone } from './workflow-status-tone';

const toneClasses = {
  neutral: 'bg-muted text-muted-foreground',
  pending: 'border-warning/30 bg-warning/10 text-warning-foreground',
  active: 'border-info/30 bg-info/10 text-info',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/15 text-warning-foreground',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
} as const;

type WorkflowStatusBadgeProps = {
  entityType?: WorkflowEntityType;
  status: AnyWorkflowEntityStatus | string;
  label?: string;
  className?: string;
};

export function WorkflowStatusBadge({ status, label, className }: WorkflowStatusBadgeProps) {
  const statusValue = String(status);
  const tone = resolveWorkflowStatusTone(statusValue);

  return (
    <Badge
      variant="outline"
      className={cn('font-medium capitalize', toneClasses[tone], className)}
      aria-label={`Status: ${label ?? formatWorkflowStatusLabel(statusValue)}`}
    >
      {label ?? formatWorkflowStatusLabel(statusValue)}
    </Badge>
  );
}
