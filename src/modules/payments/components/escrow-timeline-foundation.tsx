'use client';

import { AuditTimeline } from '@/shared/components/operational';
import { mapEscrowTimelineToAuditEntries } from '@/modules/payments/hooks/escrow-timeline';
import type { EscrowTimelineEntry } from '@/modules/payments/types';

const placeholder: EscrowTimelineEntry[] = [
  {
    id: 'et-1',
    escrowId: '00000000-0000-0000-0000-000000000055',
    fromStatus: null,
    toStatus: 'awaiting_funding',
    label: 'Escrow record created',
    timestamp: new Date(Date.now() - 172_800_000).toISOString(),
    source: 'payment_workflow',
  },
  {
    id: 'et-2',
    escrowId: '00000000-0000-0000-0000-000000000055',
    fromStatus: 'awaiting_funding',
    toStatus: 'funded',
    label: 'Business funded escrow',
    timestamp: new Date(Date.now() - 86_400_000).toISOString(),
    source: 'ledger_posted',
  },
  {
    id: 'et-3',
    escrowId: '00000000-0000-0000-0000-000000000055',
    fromStatus: 'funded',
    toStatus: 'held',
    label: 'Funds held pending shift completion',
    timestamp: new Date().toISOString(),
    source: 'payment_workflow',
  },
];

type EscrowTimelineFoundationProps = {
  entries?: EscrowTimelineEntry[];
};

export function EscrowTimelineFoundation({ entries = placeholder }: EscrowTimelineFoundationProps) {
  return <AuditTimeline entries={mapEscrowTimelineToAuditEntries(entries)} />;
}
