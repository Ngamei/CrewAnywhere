'use client';

import { ActivityFeed } from '@/shared/components/operational';
import { mapWalletActivityToFeedItems } from '@/modules/payments/hooks/wallet-activity';
import type { WalletActivityFeedItem } from '@/modules/payments/types';

const placeholder: WalletActivityFeedItem[] = [
  {
    id: 'wa-1',
    crewUserId: '00000000-0000-0000-0000-000000000040',
    title: 'Escrow release',
    description: null,
    amount: '450.00',
    currency: 'USD',
    direction: 'credit',
    transactionType: 'escrow_release',
    timestamp: new Date().toISOString(),
    paymentId: '00000000-0000-0000-0000-000000000050',
    withdrawalRequestId: null,
    ledgerEntryGroupId: '00000000-0000-0000-0000-000000000060',
  },
  {
    id: 'wa-2',
    crewUserId: '00000000-0000-0000-0000-000000000040',
    title: 'Wallet credit',
    description: 'Pending → available clearance',
    amount: '450.00',
    currency: 'USD',
    direction: 'credit',
    transactionType: 'wallet_credit',
    timestamp: new Date(Date.now() - 86_400_000).toISOString(),
    paymentId: '00000000-0000-0000-0000-000000000050',
    withdrawalRequestId: null,
    ledgerEntryGroupId: '00000000-0000-0000-0000-000000000061',
  },
];

type WalletActivityFeedFoundationProps = {
  items?: WalletActivityFeedItem[];
  isLoading?: boolean;
};

export function WalletActivityFeedFoundation({
  items = placeholder,
  isLoading,
}: WalletActivityFeedFoundationProps) {
  return (
    <ActivityFeed
      items={mapWalletActivityToFeedItems(items)}
      emptyMessage="No wallet activity yet."
      isLoading={isLoading}
    />
  );
}
