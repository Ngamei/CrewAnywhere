'use client';

import { AuditTimeline } from '@/shared/components/operational';
import { mapLedgerGroupsToTimeline } from '@/modules/payments/hooks/payment-timeline';
import type { LedgerGroupTimelineDto } from '@/modules/payments/types';

type LedgerHistoryPanelProps = {
  groups: LedgerGroupTimelineDto[];
  isLoading?: boolean;
  emptyMessage?: string;
};

export function LedgerHistoryPanel({
  groups,
  isLoading,
  emptyMessage = 'No ledger entries posted for this scope.',
}: LedgerHistoryPanelProps) {
  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" aria-busy aria-label="Loading ledger history" />;
  }

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Immutable double-entry groups from <code className="text-xs">finance_transactions</code> (read-only).
      </p>
      <AuditTimeline entries={mapLedgerGroupsToTimeline(groups)} />
    </div>
  );
}
