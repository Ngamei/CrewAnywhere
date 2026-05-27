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
};

export function WalletBalanceShellFoundation({
  balance = placeholderBalance,
  payoutsEnabled = true,
}: WalletBalanceShellFoundationProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Available</CardDescription>
          <CardTitle className="tabular-nums text-2xl">
            {balance.available_balance} {balance.currency}
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
            {balance.pending_balance} {balance.currency}
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
            {balance.lifetime_earnings} {balance.currency}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Badge variant={payoutsEnabled ? 'default' : 'secondary'}>
            {payoutsEnabled ? 'Payouts enabled' : 'Payouts disabled'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
