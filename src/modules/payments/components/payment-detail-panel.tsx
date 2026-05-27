'use client';

import { ActivityFeed } from '@/shared/components/operational';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { PaymentStatusBadge } from './payment-status-badge';
import { PaymentWorkflowTimelineFoundation } from './payment-workflow-timeline-foundation';
import { EscrowTimelineFoundation } from './escrow-timeline-foundation';
import { LedgerHistoryPanel } from './ledger-history-panel';
import { WalletLiveStatusIndicator } from './wallet-live-status-indicator';
import { PayoutStatusCard } from './payout-status-card';
import { toPayoutStatusDisplay } from '@/modules/payments/hooks/payout-status';
import { mapPaymentWorkflowToActivityFeed } from '@/modules/payments/hooks/payment-activity';
import {
  usePaymentDetail,
  usePaymentLedgerHistory,
  usePaymentTimeline,
  useWalletActivitySubscription,
} from '@/modules/payments/hooks';
import { resolvePaymentOperationalState } from '@/modules/payments/types';

type PaymentDetailPanelProps = {
  paymentId: string;
};

export function PaymentDetailPanel({ paymentId }: PaymentDetailPanelProps) {
  const { data: payment, isLoading } = usePaymentDetail(paymentId);
  const { data: timeline, isLoading: timelineLoading } = usePaymentTimeline(paymentId);
  const { data: ledgerGroups, isLoading: ledgerLoading } = usePaymentLedgerHistory(paymentId);

  useWalletActivitySubscription({
    crewUserId: payment?.crew_user_id,
    paymentId,
    enabled: Boolean(paymentId),
  });

  if (isLoading || !payment) {
    return (
      <div className="space-y-4" aria-busy aria-label="Loading payment detail">
        <div className="h-10 animate-pulse rounded-md bg-muted" />
        <div className="h-32 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  const operational = resolvePaymentOperationalState(payment.status);
  const feedItems = mapPaymentWorkflowToActivityFeed(
    (timeline ?? []).map((event) => ({
      workflow_event_id: event.workflow_event_id,
      to_status: event.to_status,
      transition_reason: event.transition_reason,
      created_at: event.created_at,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <PaymentStatusBadge status={payment.status} showOperationalLabel />
        <p className="text-sm text-muted-foreground">
          Phase: {operational.phase.replace(/_/g, ' ')} · {payment.amount} {payment.currency}
        </p>
      </div>

      <WalletLiveStatusIndicator crewUserId={payment.crew_user_id} paymentId={paymentId} />

      {payment.activeWithdrawal ? (
        <PayoutStatusCard payout={toPayoutStatusDisplay(payment.activeWithdrawal)} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escrow snapshot</CardTitle>
            <CardDescription>
              {payment.escrow
                ? `${payment.escrow.amount_held} ${payment.escrow.currency} · ${payment.escrow.status}`
                : 'No escrow record for this payment.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EscrowTimelineFoundation paymentId={paymentId} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational activity</CardTitle>
            <CardDescription>Workflow transitions via workflow_event_outbox.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={feedItems} emptyMessage="No payment workflow activity yet." isLoading={timelineLoading} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment workflow timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentWorkflowTimelineFoundation paymentId={paymentId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Immutable ledger history</CardTitle>
          <CardDescription>Double-entry groups for this payment — append-only source of truth.</CardDescription>
        </CardHeader>
        <CardContent>
          <LedgerHistoryPanel groups={ledgerGroups ?? []} isLoading={ledgerLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
