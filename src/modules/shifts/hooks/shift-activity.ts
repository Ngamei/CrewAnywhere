import type { ActivityFeedItem } from '@/shared/components/operational';
import type { WorkflowEventPayload } from '@/shared/events';
import { formatWorkflowStatusLabel } from '@/shared/components/operational/workflow-status-tone';
import { shiftQueryKeys } from './shift-query-keys';

export const SHIFT_WORKFLOW_REALTIME_TOPIC = 'workflow.shifts' as const;
export const SHIFT_WORKFLOW_BROADCAST_EVENT = 'workflow_transition' as const;

export type ShiftActivityPayload = WorkflowEventPayload;

export type ShiftActivitySubscriptionOptions = {
  shiftId?: string;
  assignmentId?: string;
  enabled?: boolean;
};

export function isShiftActivityPayload(value: unknown): value is ShiftActivityPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return payload.entity_type === 'shift' && typeof payload.entity_id === 'string';
}

export function parseShiftActivityPayload(value: unknown): ShiftActivityPayload | null {
  return isShiftActivityPayload(value) ? value : null;
}

export function getShiftInvalidationKeys(
  payload: ShiftActivityPayload,
  filters: { assignmentId?: string } = {},
): readonly (readonly unknown[])[] {
  return [
    shiftQueryKeys.all,
    shiftQueryKeys.list(filters),
    shiftQueryKeys.detail(payload.entity_id),
    shiftQueryKeys.timeline(payload.entity_id),
    shiftQueryKeys.activity(payload.entity_id),
    ...(filters.assignmentId ? [shiftQueryKeys.byAssignment(filters.assignmentId)] : []),
  ] as const;
}

export function mapShiftActivityToFeedItem(payload: ShiftActivityPayload): ActivityFeedItem {
  const fromLabel = payload.from_status ? formatWorkflowStatusLabel(payload.from_status) : null;
  const toLabel = formatWorkflowStatusLabel(payload.to_status);

  return {
    id: payload.workflow_event_id,
    title: fromLabel ? `Shift moved to ${toLabel}` : `Shift created as ${toLabel}`,
    description: fromLabel ? `${fromLabel} → ${toLabel}` : `Workflow transition via ${payload.transition_source}`,
    timestamp: payload.created_at,
  };
}
