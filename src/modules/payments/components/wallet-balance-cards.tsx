'use client';

import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import type { WalletBalanceSummaryDto } from '@/modules/payments/types';

type WalletBalanceCardsProps = {
  balance: WalletBalanceSummaryDto;
  payoutsEnabled?: boolean;
};

function formatBalanceLabel(value: string, currency: string) {
  return `${value} ${currency}`;
}

export function WalletBalanceCards({ balance, payoutsEnabled = false }: WalletBalanceCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Available</CardDescription>
          <CardTitle className="tabular-nums text-2xl">
            {formatBalanceLabel(balance.available_balance, balance.currency)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Withdrawable — posted crew_wallet_available ledger net</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Pending</CardDescription>
          <CardTitle className="tabular-nums text-2xl">
            {formatBalanceLabel(balance.pending_balance, balance.currency)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Clearance hold — posted crew_wallet_pending ledger net</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Lifetime earnings</CardDescription>
          <CardTitle className="tabular-nums text-2xl">
            {formatBalanceLabel(balance.lifetime_earnings, balance.currency)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Badge variant={payoutsEnabled ? 'default' : 'secondary'}>
            {payoutsEnabled ? 'Payouts enabled' : 'Payouts disabled'}
          </Badge>
          {balance.last_ledger_entry_at ? (
            <p className="text-xs text-muted-foreground">
              Last ledger entry {new Date(balance.last_ledger_entry_at).toLocaleString()}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">No posted ledger entries yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
