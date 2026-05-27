import { AuditTimeline } from '@/shared/components/operational';
import { mapWorkflowEventsToTimeline } from '@/modules/proposals/hooks/workflow-timeline';

type WorkflowEventRow = {
  workflow_event_id: string;
  from_status: string | null;
  to_status: string;
  transition_reason: string | null;
  transition_source: string | null;
  created_at: string;
};

const placeholderEvents: WorkflowEventRow[] = [
  {
    workflow_event_id: '1',
    from_status: null,
    to_status: 'applied',
    transition_reason: 'Crew submitted proposal',
    transition_source: 'crew_user',
    created_at: new Date().toISOString(),
  },
];

type ProposalWorkflowTimelineProps = {
  events?: WorkflowEventRow[];
};

export function ProposalWorkflowTimeline({ events = placeholderEvents }: ProposalWorkflowTimelineProps) {
  return <AuditTimeline entries={mapWorkflowEventsToTimeline(events)} />;
}
