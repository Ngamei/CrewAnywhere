import type { ActivityFeedItem } from '@/shared/components/operational';
import type { FinanceTransactionHistoryLine, TransactionHistoryItemDto } from '@/modules/payments/types';
import { formatWorkflowStatusLabel } from '@/shared/components/operational/workflow-status-tone';

type PaymentWorkflowActivityRow = {
  workflow_event_id: string;
  to_status: string;
  transition_reason: string | null;
  created_at: string;
};

export function mapPaymentWorkflowToActivityFeed(events: PaymentWorkflowActivityRow[]): ActivityFeedItem[] {
  return events.map((event) => ({
    id: event.workflow_event_id,
    title: event.transition_reason ?? `Payment ${formatWorkflowStatusLabel(event.to_status)}`,
    timestamp: event.created_at,
  }));
}

export function mapLedgerLinesToTransactionHistory(lines: FinanceTransactionHistoryLine[]): TransactionHistoryItemDto[] {
  return lines.map((line) => ({
    id: line.id,
    label: formatLedgerLineLabel(line.transactionType, line.ledgerAccount),
    transactionType: line.transactionType,
    amount: line.amount,
    currency: line.currency,
    direction: line.direction,
    postedAt: line.postedAt,
    ledgerEntryGroupId: line.ledgerEntryGroupId,
  }));
}

export function mapTransactionHistoryToActivityFeed(items: TransactionHistoryItemDto[]): ActivityFeedItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.label,
    description: `${item.direction} · ${item.amount} ${item.currency}`,
    timestamp: item.postedAt,
  }));
}

function formatLedgerLineLabel(transactionType: string, account: string): string {
  return `${formatWorkflowStatusLabel(transactionType)} (${account.replace(/_/g, ' ')})`;
}
