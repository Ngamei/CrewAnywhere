import { PaymentDetailPanel } from '@/modules/payments/components';

type PaymentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Payment detail</h2>
        <p className="text-sm text-muted-foreground">
          Payment <span className="font-mono text-xs">{id.slice(0, 8)}…</span> — escrow timeline, workflow activity, and
          immutable ledger history.
        </p>
      </div>
      <PaymentDetailPanel paymentId={id} />
    </section>
  );
}
