'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';
import { WalletBalanceShellFoundation } from './wallet-balance-shell-foundation';
import { WalletActivityFeedFoundation } from './wallet-activity-feed-foundation';
import { WalletLiveStatusIndicator } from './wallet-live-status-indicator';
import { WithdrawalRequestShell } from './withdrawal-request-shell';
import { WithdrawalHistory } from './withdrawal-history';
import {
  useWallet,
  useWalletActivity,
  useWalletBalance,
  useWalletWithdrawals,
  useWalletActivitySubscription,
} from '@/modules/payments/hooks';

type WalletDashboardProps = {
  crewUserId?: string;
};

export function WalletDashboard({ crewUserId: crewUserIdProp }: WalletDashboardProps) {
  const { data: session, isLoading: sessionLoading } = usePlatformSession();
  const crewUserId = crewUserIdProp ?? session?.identity.crewUserId ?? undefined;

  useWalletActivitySubscription({ crewUserId, enabled: Boolean(crewUserId) });

  const { data: balance, isLoading: balanceLoading } = useWalletBalance(crewUserId);
  const { data: wallet, isLoading: walletLoading } = useWallet(crewUserId);
  const { data: activity, isLoading: activityLoading } = useWalletActivity(crewUserId);
  const { data: withdrawals, isLoading: withdrawalsLoading } = useWalletWithdrawals(crewUserId);

  if (sessionLoading || (!crewUserId && !sessionLoading)) {
    return (
      <p className="text-sm text-muted-foreground">
        {sessionLoading
          ? 'Loading session…'
          : 'Sign in as a crew user to view wallet balances and ledger activity.'}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <WalletLiveStatusIndicator crewUserId={crewUserId} />

      <WalletBalanceShellFoundation
        balance={balance}
        payoutsEnabled={wallet?.payouts_enabled ?? false}
        isLoading={balanceLoading || walletLoading}
        lastLedgerEntryAt={balance?.last_ledger_entry_at}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <WithdrawalRequestShell
          balance={balance}
          payoutsEnabled={wallet?.payouts_enabled ?? false}
          isLoading={balanceLoading}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending vs available</CardTitle>
            <CardDescription>
              Balances are derived from posted ledger lines — workflow tables never hold money.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Available</span>{' '}
              <span className="font-medium tabular-nums">
                {balance?.available_balance ?? '—'} {balance?.currency ?? ''}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Pending clearance</span>{' '}
              <span className="font-medium tabular-nums">
                {balance?.pending_balance ?? '—'} {balance?.currency ?? ''}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Withdrawal history</h3>
        <p className="text-sm text-muted-foreground">Payout lifecycle from withdrawal workflow status (not ledger balances).</p>
        <WithdrawalHistory withdrawals={withdrawals ?? []} isLoading={withdrawalsLoading} />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Wallet activity</h3>
        <p className="text-sm text-muted-foreground">
          Replay-safe feed from immutable ledger — refreshes on workflow_event_outbox broadcasts.
        </p>
        <WalletActivityFeedFoundation items={activity ?? []} isLoading={activityLoading} />
      </div>
    </div>
  );
}
