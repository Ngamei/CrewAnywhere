import { AuditTimeline } from '@/shared/components/operational';
import { mapShiftWorkflowEventsToTimeline, type ShiftWorkflowEventRow } from '@/modules/shifts/hooks';

const placeholderEvents: ShiftWorkflowEventRow[] = [
  {
    workflow_event_id: '00000000-0000-0000-0000-000000000101',
    from_status: null,
    to_status: 'scheduled',
    transition_reason: 'Shift scheduled from assignment',
    transition_source: 'workflow_executor',
    created_at: new Date().toISOString(),
  },
  {
    workflow_event_id: '00000000-0000-0000-0000-000000000102',
    from_status: 'scheduled',
    to_status: 'checked_in',
    transition_reason: 'Crew checked in via supervisor verification',
    transition_source: 'supervisor_user',
    created_at: new Date().toISOString(),
  },
];

type ShiftWorkflowTimelineProps = {
  events?: ShiftWorkflowEventRow[];
  isLoading?: boolean;
};

export function ShiftWorkflowTimeline({ events = placeholderEvents, isLoading }: ShiftWorkflowTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy aria-label="Loading shift workflow timeline">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  return <AuditTimeline entries={mapShiftWorkflowEventsToTimeline(events)} />;
}
