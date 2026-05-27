'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';
import {
  WalletLiveStatusIndicator,
  type WalletLiveStatusSnapshot,
} from './wallet-live-status-indicator';
import { InlineLoadingSpinner } from '@/shared/components/operational/loading-states';

type WalletPageToolbarProps = {
  crewUserId?: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
  realtime?: WalletLiveStatusSnapshot;
};

export function WalletPageToolbar({
  crewUserId,
  onRefresh,
  isRefreshing,
  className,
  realtime,
}: WalletPageToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Wallet</h2>
          <p className="text-sm text-muted-foreground">
            Balances from ledger-derived views; withdrawals follow workflow state — balances are never mutated in UI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRefreshing ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <InlineLoadingSpinner />
              Refreshing…
            </span>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('mr-2 size-4', isRefreshing && 'animate-spin')} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>
      <WalletLiveStatusIndicator crewUserId={crewUserId} realtime={realtime} />
    </div>
  );
}
