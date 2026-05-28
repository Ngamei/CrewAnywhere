'use client';

import { WalletSetupEmptyState } from '@/modules/onboarding';
import { AsyncBoundary } from '@/shared/components/operational';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { useWalletOperational } from '@/modules/payments/hooks/use-wallet-operational';
import { WalletBalanceCards } from './wallet-balance-cards';
import { WalletPageToolbar } from './wallet-page-toolbar';
import { WalletTransactionFeed } from './wallet-transaction-feed';
import { WalletPayoutStatusStrip } from './wallet-payout-status-strip';
import { WithdrawalRequestPanel } from './withdrawal-request-panel';
import { WithdrawalHistory } from './withdrawal-history';

export function WalletOperationalScreen() {
  const operational = useWalletOperational();

  if (!operational.isCrewAccount && !operational.isSessionLoading) {
    return (
      <OperationalEmptyState
        variant="payments"
        title="Crew wallet only"
        description="Sign in with a crew account to view balances, transaction history, and withdrawal requests."
        actionLabel="Reload session"
        onAction={operational.reloadSession}
      />
    );
  }

  if (!operational.crewUserId && !operational.isSessionLoading) {
    return <WalletSetupEmptyState />;
  }

  const balance = operational.balance ?? {
    available_balance: '0.00',
    pending_balance: '0.00',
    lifetime_earnings: '0.00',
    currency: operational.wallet?.default_currency ?? 'USD',
    last_ledger_entry_at: null,
  };

  return (
    <section className="space-y-8">
      <WalletPageToolbar
        crewUserId={operational.crewUserId}
        onRefresh={operational.refreshWallet}
        isRefreshing={operational.isRefreshing}
        realtime={{
          connectionState: operational.realtime.connectionState,
          lastActivityAt: operational.realtime.lastActivityAt,
        }}
      />

      <AsyncBoundary
        isLoading={operational.isInitialLoading}
        error={operational.error}
        onRetry={operational.refreshWallet}
        loadingFallback={<FormSectionSkeleton rows={6} />}
      >
        <WalletBalanceCards balance={balance} payoutsEnabled={operational.payoutsEnabled} />

        <WalletPayoutStatusStrip withdrawals={operational.withdrawals} />

        <div className="grid gap-6 lg:grid-cols-2">
          {operational.crewUserId ? (
            <WithdrawalRequestPanel
              crewUserId={operational.crewUserId}
              balance={operational.balance}
              payoutsEnabled={operational.payoutsEnabled}
              isLoading={operational.isRefreshing}
              onSubmitted={operational.refreshWallet}
            />
          ) : null}

          <div className="space-y-3">
            <h3 className="text-lg font-medium">Withdrawal history</h3>
            <p className="text-sm text-muted-foreground">
              Mutable workflow status on withdrawal_requests — payout completion posts new ledger groups.
            </p>
            <WithdrawalHistory withdrawals={operational.withdrawals} isLoading={operational.isRefreshing} />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Transaction history</h3>
          <p className="text-sm text-muted-foreground">
            Posted finance_transactions for your crew wallet accounts (read-only, replay-safe).
          </p>
          <WalletTransactionFeed
            items={operational.activity}
            isLoading={operational.isRefreshing}
            canLoadMore={operational.canLoadMoreActivity}
            isLoadingMore={operational.isLoadingMoreActivity}
            loadMoreError={operational.activityLoadMoreError}
            onLoadMore={operational.loadMoreActivity}
          />
        </div>
      </AsyncBoundary>
    </section>
  );
}
