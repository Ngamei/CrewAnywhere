'use client';

import type { PayoutStatusDisplay } from '@/modules/payments/types';
import { PayoutStatusIndicator } from './payout-status-indicator';

type WalletPayoutStatusStripProps = {
  withdrawals: PayoutStatusDisplay[];
  title?: string;
};

export function WalletPayoutStatusStrip({
  withdrawals,
  title = 'Active payout requests',
}: WalletPayoutStatusStripProps) {
  const active = withdrawals.filter((item) => !item.isTerminal);

  if (active.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="text-lg font-medium">{title}</h3>
      <ul className="flex flex-col gap-2">
        {active.map((payout) => (
          <li key={payout.withdrawalId}>
            <PayoutStatusIndicator payout={payout} />
          </li>
        ))}
      </ul>
    </section>
  );
}
