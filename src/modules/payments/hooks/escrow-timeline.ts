import type { AuditTimelineEntry } from '@/shared/components/operational';
import type { EscrowTimelineEntry } from '@/modules/payments/types';
import { formatWorkflowStatusLabel } from '@/shared/components/operational/workflow-status-tone';

export function mapEscrowTimelineToAuditEntries(entries: EscrowTimelineEntry[]): AuditTimelineEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    action: entry.label || formatEscrowTransitionLabel(entry.fromStatus, entry.toStatus),
    fromStatus: entry.fromStatus ?? undefined,
    toStatus: entry.toStatus,
    timestamp: entry.timestamp,
    actor: entry.source,
  }));
}

function formatEscrowTransitionLabel(from: string | null, to: string): string {
  if (!from) return `Escrow opened — ${formatWorkflowStatusLabel(to)}`;
  return `${formatWorkflowStatusLabel(from)} → ${formatWorkflowStatusLabel(to)}`;
}
