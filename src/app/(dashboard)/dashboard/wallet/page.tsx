import { WalletDashboard } from '@/modules/payments/components';

export default function WalletPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Wallet</h2>
        <p className="text-sm text-muted-foreground">
          Crew wallet balances from <code className="text-xs">crew_wallet_balances</code> — activity from immutable
          ledger groups. Realtime refresh via <code className="text-xs">workflow_event_outbox</code> broadcasts.
        </p>
      </div>
      <WalletDashboard />
    </section>
  );
}
