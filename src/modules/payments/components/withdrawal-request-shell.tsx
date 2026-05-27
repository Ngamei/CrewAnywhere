'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import type { WalletBalanceSummaryDto } from '@/modules/payments/types';

type WithdrawalRequestShellProps = {
  balance: WalletBalanceSummaryDto | undefined;
  payoutsEnabled: boolean;
  isLoading?: boolean;
};

export function WithdrawalRequestShell({
  balance,
  payoutsEnabled,
  isLoading,
}: WithdrawalRequestShellProps) {
  const available = balance?.available_balance ?? '—';
  const currency = balance?.currency ?? 'USD';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request withdrawal</CardTitle>
        <CardDescription>
          Operational shell only — withdrawal execution and ledger reservation run server-side via workflow
          guards (not exposed in Phase 2B UI).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">Available to withdraw</p>
          <p className="text-2xl font-semibold tabular-nums">
            {available} {currency}
          </p>
        </div>
        <Button type="button" disabled className="w-full sm:w-auto">
          {isLoading ? 'Loading balance…' : 'Request withdrawal (coming soon)'}
        </Button>
        {!payoutsEnabled ? (
          <p className="text-xs text-destructive">Payouts are disabled on this wallet. Contact support to enable.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
