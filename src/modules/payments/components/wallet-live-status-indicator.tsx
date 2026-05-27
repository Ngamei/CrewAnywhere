'use client';

import { StateIndicator } from '@/shared/components/operational';
import { cn } from '@/shared/lib/cn';
import {
  useWalletActivitySubscription,
  type WalletRealtimeConnectionState,
} from '@/modules/payments/hooks/use-wallet-activity-subscription';

export type WalletLiveStatusSnapshot = {
  connectionState: WalletRealtimeConnectionState;
  lastActivityAt: string | null;
};

type WalletLiveStatusIndicatorProps = {
  crewUserId?: string;
  paymentId?: string;
  className?: string;
  /** When provided, skips creating a duplicate Supabase subscription (e.g. from useWalletOperational). */
  realtime?: WalletLiveStatusSnapshot;
};

function mapConnectionToIndicator(connectionState: WalletRealtimeConnectionState) {
  switch (connectionState) {
    case 'live':
      return { variant: 'live' as const, label: 'Live — workflow.payments & workflow.withdrawals' };
    case 'connecting':
      return { variant: 'syncing' as const, label: 'Connecting to wallet workflow channels' };
    case 'offline':
      return { variant: 'offline' as const, label: 'Realtime offline' };
    default:
      return { variant: 'idle' as const, label: 'Realtime idle' };
  }
}

export function WalletLiveStatusIndicator({
  crewUserId,
  paymentId,
  className,
  realtime,
}: WalletLiveStatusIndicatorProps) {
  const subscription = useWalletActivitySubscription({
    crewUserId,
    paymentId,
    enabled: realtime === undefined,
  });
  const connectionState = realtime?.connectionState ?? subscription.connectionState;
  const lastActivityAt = realtime?.lastActivityAt ?? subscription.lastActivityAt;

  const indicator = mapConnectionToIndicator(connectionState);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2', className)}>
      <StateIndicator variant={indicator.variant} label={indicator.label} />
      {lastActivityAt ? (
        <p className="text-xs text-muted-foreground">
          Last workflow activity {new Date(lastActivityAt).toLocaleTimeString()}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Subscribed via workflow_event_outbox broadcast (immutable ledger unchanged)
        </p>
      )}
    </div>
  );
}
