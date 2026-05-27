'use client';

import type { PayoutStatusDisplay } from '@/modules/payments/types';
import { PayoutStatusCard } from './payout-status-card';

type WithdrawalHistoryProps = {
  withdrawals: PayoutStatusDisplay[];
  isLoading?: boolean;
};

export function WithdrawalHistory({ withdrawals, isLoading }: WithdrawalHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy aria-label="Loading withdrawal history">
        <div className="h-28 animate-pulse rounded-md bg-muted" />
        <div className="h-28 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {withdrawals.map((payout) => (
        <PayoutStatusCard key={payout.withdrawalId} payout={payout} />
      ))}
    </div>
  );
}
