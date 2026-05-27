import type { AuditTimelineEntry } from '@/shared/components/operational';

export type ShiftWorkflowEventRow = {
  workflow_event_id: string;
  from_status: string | null;
  to_status: string;
  transition_reason: string | null;
  transition_source: string | null;
  created_at: string;
};

export function mapShiftWorkflowEventsToTimeline(events: ShiftWorkflowEventRow[]): AuditTimelineEntry[] {
  return events.map((event) => ({
    id: event.workflow_event_id,
    action: event.transition_reason ?? `Transition to ${event.to_status}`,
    fromStatus: event.from_status ?? undefined,
    toStatus: event.to_status,
    timestamp: event.created_at,
    actor: event.transition_source ?? undefined,
  }));
}
