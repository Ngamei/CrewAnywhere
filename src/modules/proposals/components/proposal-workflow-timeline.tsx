'use client';

import { useCallback } from 'react';
import { mapWorkflowEventsToTimeline } from '@/modules/proposals/hooks/workflow-timeline';
import { AuditTimeline, AsyncBoundary } from '@/shared/components/operational';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';
import type { ApiSuccess } from '@/shared/api/responses';

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
  proposalId?: string;
};

export function ProposalWorkflowTimeline({ proposalId }: ProposalWorkflowTimelineProps) {
  const fetcher = useCallback(async (): Promise<WorkflowEventRow[]> => {
    if (!proposalId) return placeholderEvents;
    const response = await fetch(`/api/v1/proposals/${proposalId}/timeline`, { credentials: 'include' });
    const body = (await response.json().catch(() => null)) as
      | ApiSuccess<WorkflowEventRow[]>
      | { error?: { message?: string } }
      | null;
    if (!response.ok || !body || !('data' in body)) {
      throw new Error(
        (body && 'error' in body && body.error?.message) ||
          `Unable to load workflow timeline (${response.status})`,
      );
    }
    return body.data;
  }, [proposalId]);

  const query = useOperationalFetch({
    queryKey: ['proposal', 'timeline', proposalId ?? 'placeholder'],
    fetcher,
  });

  return (
    <AsyncBoundary isLoading={query.isLoading} error={query.error} onRetry={query.reload}>
      <AuditTimeline entries={mapWorkflowEventsToTimeline(query.data ?? placeholderEvents)} />
    </AsyncBoundary>
  );
}
