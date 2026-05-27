import {
  EscrowTimelineFoundation,
  PaymentWorkflowTimelineFoundation,
  PaymentsTableFoundation,
} from '@/modules/payments/components';

export default function PaymentsShellPage() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Payments</h2>
        <p className="text-sm text-muted-foreground">
          Assignment-linked payment workflow — list via{' '}
          <code className="text-xs">GET /api/v1/payments</code> (foundation; not wired).
        </p>
      </div>

      <PaymentsTableFoundation />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Payment workflow</h3>
          <p className="text-sm text-muted-foreground">
            Mutable status from <code className="text-xs">workflow_transition_events</code> — aligns with{' '}
            <code className="text-xs">payment-lifecycle</code>.
          </p>
          <PaymentWorkflowTimelineFoundation />
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Escrow timeline</h3>
          <p className="text-sm text-muted-foreground">
            Operational escrow state — balances remain ledger-derived.
          </p>
          <EscrowTimelineFoundation />
        </div>
      </div>
    </section>
  );
}
