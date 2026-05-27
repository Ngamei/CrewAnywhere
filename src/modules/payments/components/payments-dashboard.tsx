'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';
import { PaymentsTableFoundation } from './payments-table-foundation';
import { PaymentWorkflowTimelineFoundation } from './payment-workflow-timeline-foundation';
import { EscrowTimelineFoundation } from './escrow-timeline-foundation';
import { WalletLiveStatusIndicator } from './wallet-live-status-indicator';
import { usePaymentsList, useWalletActivitySubscription } from '@/modules/payments/hooks';

const samplePaymentId = '00000000-0000-0000-0000-000000000050';

export function PaymentsDashboard() {
  const { data: session } = usePlatformSession();
  const crewUserId = session?.identity.crewUserId ?? undefined;

  useWalletActivitySubscription({ crewUserId, enabled: Boolean(crewUserId) });

  const { data: payments, isLoading } = usePaymentsList({ crewUserId });

  const featuredPaymentId = payments?.[0]?.id;

  return (
    <div className="space-y-8">
      <WalletLiveStatusIndicator crewUserId={crewUserId} paymentId={featuredPaymentId} />

      <PaymentsTableFoundation data={payments ?? []} isLoading={isLoading} />

      {featuredPaymentId ? (
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/dashboard/payments/${featuredPaymentId}` as Route}
            className="text-primary underline-offset-4 hover:underline"
          >
            Open payment detail
          </Link>{' '}
          for escrow timeline and immutable ledger history.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment workflow (sample)</CardTitle>
            <CardDescription>
              Select a payment row when wired — showing placeholder until a payment is selected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentWorkflowTimelineFoundation paymentId={featuredPaymentId ?? samplePaymentId} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escrow timeline (sample)</CardTitle>
            <CardDescription>Operational escrow state — balances remain ledger-derived.</CardDescription>
          </CardHeader>
          <CardContent>
            <EscrowTimelineFoundation paymentId={featuredPaymentId ?? samplePaymentId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
