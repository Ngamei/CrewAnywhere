'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { WorkflowStatusBadge } from '@/shared/components/operational';
import { resolveWithdrawalOperationalState } from '@/modules/payments/types';
import type { PayoutStatusDisplay } from '@/modules/payments/types';

type PayoutStatusCardProps = {
  payout: PayoutStatusDisplay;
};

export function PayoutStatusCard({ payout }: PayoutStatusCardProps) {
  const operational = resolveWithdrawalOperationalState(payout.status);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base tabular-nums">
            {payout.amount} {payout.currency}
          </CardTitle>
          <WorkflowStatusBadge status={payout.status} label={payout.operationalLabel} />
        </div>
        <CardDescription>
          Withdrawal {payout.withdrawalId.slice(0, 8)}…
          {payout.payoutMethodLabel ? ` · ${payout.payoutMethodLabel}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-sm font-medium">
          Phase: {operational.phase.replace(/_/g, ' ')}
          {operational.isTerminal ? ' (terminal)' : ''}
        </p>
        <p className="text-muted-foreground">
          Requested {new Date(payout.requestedAt).toLocaleString()}
          {payout.processedAt ? ` · Processed ${new Date(payout.processedAt).toLocaleString()}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          Payment ref <span className="font-mono">{payout.paymentId.slice(0, 8)}…</span>
        </p>
      </CardContent>
    </Card>
  );
}
