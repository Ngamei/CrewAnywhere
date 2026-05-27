import { WalletActivityFeedFoundation, WalletBalanceShellFoundation } from '@/modules/payments/components';

export default function WalletShellPage() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Wallet</h2>
        <p className="text-sm text-muted-foreground">
          Crew wallet balances from <code className="text-xs">crew_wallet_balances</code> view — activity from
          immutable ledger groups via <code className="text-xs">GET /api/v1/wallets/:crewUserId/activity</code>{' '}
          (foundation; not wired).
        </p>
      </div>

      <WalletBalanceShellFoundation />

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Activity feed</h3>
        <p className="text-sm text-muted-foreground">
          Replay-safe feed mapped from posted <code className="text-xs">finance_transactions</code> — no balance
          mutations in UI layer.
        </p>
        <WalletActivityFeedFoundation />
      </div>
    </section>
  );
}
