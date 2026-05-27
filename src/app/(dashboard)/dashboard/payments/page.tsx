import { PaymentsDashboard } from '@/modules/payments/components';

export default function PaymentsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Payments</h2>
        <p className="text-sm text-muted-foreground">
          Assignment-linked payment workflow — operational views over payments, escrow, and ledger read models.
        </p>
      </div>
      <PaymentsDashboard />
    </section>
  );
}
