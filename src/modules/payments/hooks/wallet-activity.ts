import type { ActivityFeedItem } from '@/shared/components/operational';
import type { WalletActivityFeedItem } from '@/modules/payments/types';
import { formatWorkflowStatusLabel } from '@/shared/components/operational/workflow-status-tone';

export function mapWalletActivityToFeedItems(items: WalletActivityFeedItem[]): ActivityFeedItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? formatWalletActivityDescription(item),
    timestamp: item.timestamp,
  }));
}

export function buildWalletActivityTitle(transactionType: WalletActivityFeedItem['transactionType']): string {
  return formatWorkflowStatusLabel(transactionType);
}

function formatWalletActivityDescription(item: WalletActivityFeedItem): string {
  const sign = item.direction === 'credit' ? '+' : '−';
  const amountPart = `${sign}${item.amount} ${item.currency}`;
  const contextParts = [formatWorkflowStatusLabel(item.transactionType), amountPart];
  if (item.paymentId) contextParts.push(`payment ${item.paymentId.slice(0, 8)}…`);
  if (item.withdrawalRequestId) contextParts.push(`withdrawal ${item.withdrawalRequestId.slice(0, 8)}…`);
  return contextParts.join(' · ');
}
