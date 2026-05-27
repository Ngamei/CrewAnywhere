import type { AuditTimelineEntry } from '@/shared/components/operational';
import type { LedgerGroupTimelineDto } from '@/modules/payments/types';

type WorkflowEventRow = {
  workflow_event_id: string;
  from_status: string | null;
  to_status: string;
  transition_reason: string | null;
  transition_source: string | null;
  created_at: string;
};

export function mapPaymentWorkflowEventsToTimeline(events: WorkflowEventRow[]): AuditTimelineEntry[] {
  return events.map((event) => ({
    id: event.workflow_event_id,
    action: event.transition_reason ?? `Payment → ${event.to_status}`,
    fromStatus: event.from_status ?? undefined,
    toStatus: event.to_status,
    timestamp: event.created_at,
    actor: event.transition_source ?? undefined,
  }));
}

export function mapLedgerGroupsToTimeline(groups: LedgerGroupTimelineDto[]): AuditTimelineEntry[] {
  return groups.map((group) => ({
    id: group.ledgerEntryGroupId,
    action: formatLedgerGroupLabel(group.transactionType),
    toStatus: group.transactionType,
    timestamp: group.postedAt,
    detail: `${group.netAmount} ${group.currency}`,
  }));
}

function formatLedgerGroupLabel(transactionType: string): string {
  return transactionType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
