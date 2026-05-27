'use client';

import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import type { WalletBalanceSummaryDto } from '@/modules/payments/types';

const placeholderBalance: WalletBalanceSummaryDto = {
  available_balance: '1250.00',
  pending_balance: '450.00',
  lifetime_earnings: '8420.00',
  currency: 'USD',
  last_ledger_entry_at: new Date().toISOString(),
};

type WalletBalanceShellFoundationProps = {
  balance?: WalletBalanceSummaryDto;
  payoutsEnabled?: boolean;
  isLoading?: boolean;
  lastLedgerEntryAt?: string | null;
};

export function WalletBalanceShellFoundation({
  balance = placeholderBalance,
  payoutsEnabled = true,
  isLoading,
  lastLedgerEntryAt,
}: WalletBalanceShellFoundationProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3" aria-busy aria-label="Loading wallet balances">
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const resolved = balance ?? placeholderBalance;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Available</CardDescription>
          <CardTitle className="tabular-nums text-2xl">
            {resolved.available_balance} {resolved.currency}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">From posted `crew_wallet_available` ledger entries</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Pending</CardDescription>
          <CardTitle className="tabular-nums text-2xl">
            {resolved.pending_balance} {resolved.currency}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Clearance hold on `crew_wallet_pending`</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Lifetime earnings</CardDescription>
          <CardTitle className="tabular-nums text-2xl">
            {resolved.lifetime_earnings} {resolved.currency}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Badge variant={payoutsEnabled ? 'default' : 'secondary'}>
            {payoutsEnabled ? 'Payouts enabled' : 'Payouts disabled'}
          </Badge>
          {lastLedgerEntryAt ?? resolved.last_ledger_entry_at ? (
            <p className="text-xs text-muted-foreground">
              Last ledger entry{' '}
              {new Date((lastLedgerEntryAt ?? resolved.last_ledger_entry_at) as string).toLocaleString()}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
