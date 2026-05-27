'use client';

import { StateIndicator } from '@/shared/components/operational';
import type { PayoutStatusDisplay } from '@/modules/payments/types';
import type { WorkflowStatusTone } from '@/shared/design/tokens/colors';

type PayoutStatusIndicatorProps = {
  payout: PayoutStatusDisplay;
};

function mapToneToVariant(tone: WorkflowStatusTone) {
  switch (tone) {
    case 'success':
      return 'live' as const;
    case 'danger':
      return 'offline' as const;
    case 'warning':
    case 'pending':
      return 'syncing' as const;
    default:
      return 'idle' as const;
  }
}

export function PayoutStatusIndicator({ payout }: PayoutStatusIndicatorProps) {
  return (
    <StateIndicator
      variant={mapToneToVariant(payout.tone)}
      label={`${payout.operationalLabel} · ${payout.amount} ${payout.currency}`}
    />
  );
}
