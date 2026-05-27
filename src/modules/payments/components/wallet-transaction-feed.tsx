'use client';

import { ActivityFeed } from '@/shared/components/operational';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { mapWalletActivityToFeedItems } from '@/modules/payments/hooks/wallet-activity';
import type { WalletActivityFeedItem } from '@/modules/payments/types';

type WalletTransactionFeedProps = {
  items: WalletActivityFeedItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  canLoadMore?: boolean;
  isLoadingMore?: boolean;
  loadMoreError?: Error | null;
  onLoadMore?: () => void;
};

function formatActivityTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function mapItemsWithTransactionMeta(items: WalletActivityFeedItem[]) {
  return mapWalletActivityToFeedItems(items).map((feedItem, index) => {
    const source = items[index];
    if (!source) return feedItem;

    const sign = source.direction === 'credit' ? '+' : '−';

    return {
      ...feedItem,
      timestamp: formatActivityTimestamp(feedItem.timestamp),
      meta: (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={source.direction === 'credit' ? 'default' : 'secondary'} className="tabular-nums">
            {sign}
            {source.amount} {source.currency}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            group {source.ledgerEntryGroupId.slice(0, 8)}…
          </span>
        </div>
      ),
    };
  });
}

export function WalletTransactionFeed({
  items,
  isLoading,
  emptyMessage = 'No wallet transactions yet. Activity appears when ledger entries post for your crew wallet.',
  canLoadMore,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
}: WalletTransactionFeedProps) {
  return (
    <div className="space-y-3">
      <ActivityFeed
        items={mapItemsWithTransactionMeta(items)}
        emptyMessage={emptyMessage}
        isLoading={isLoading}
      />
      {loadMoreError ? (
        <p className="text-sm text-destructive">{loadMoreError.message}</p>
      ) : null}
      {canLoadMore && onLoadMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void onLoadMore()}
          disabled={isLoadingMore || isLoading}
        >
          {isLoadingMore ? 'Loading…' : 'Load more transactions'}
        </Button>
      ) : null}
    </div>
  );
}
