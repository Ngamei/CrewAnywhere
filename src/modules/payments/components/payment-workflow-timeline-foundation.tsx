'use client';

import { AuditTimeline } from '@/shared/components/operational';
import { mapPaymentWorkflowEventsToTimeline } from '@/modules/payments/hooks/payment-timeline';
import { usePaymentTimeline } from '@/modules/payments/hooks/use-payment-data';

type WorkflowEventRow = {
  workflow_event_id: string;
  from_status: string | null;
  to_status: string;
  transition_reason: string | null;
  transition_source: string | null;
  created_at: string;
};

const placeholderEvents: WorkflowEventRow[] = [
  {
    workflow_event_id: 'pe-1',
    from_status: null,
    to_status: 'pending',
    transition_reason: 'Payment created for assignment',
    transition_source: 'service_role',
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
  {
    workflow_event_id: 'pe-2',
    from_status: 'pending',
    to_status: 'authorized',
    transition_reason: 'Business payment method authorized',
    transition_source: 'service_role',
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    workflow_event_id: 'pe-3',
    from_status: 'authorized',
    to_status: 'funded',
    transition_reason: 'Escrow funded — ledger group balanced',
    transition_source: 'service_role',
    created_at: new Date().toISOString(),
  },
];

type PaymentWorkflowTimelineFoundationProps = {
  paymentId?: string;
  events?: WorkflowEventRow[];
};

export function PaymentWorkflowTimelineFoundation({
  paymentId,
  events: eventsProp,
}: PaymentWorkflowTimelineFoundationProps) {
  const { data: fetchedEvents, isLoading } = usePaymentTimeline(paymentId);
  const events = paymentId ? (fetchedEvents ?? []) : (eventsProp ?? placeholderEvents);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" aria-busy aria-label="Loading payment timeline" />;
  }

  return <AuditTimeline entries={mapPaymentWorkflowEventsToTimeline(events)} />;
}
