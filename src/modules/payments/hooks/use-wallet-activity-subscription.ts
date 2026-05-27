'use client';

import { useEffect, useState } from 'react';
import { useOperationalRefresh } from '@/shared/hooks/use-operational-refresh';
import { createSupabaseBrowserClient } from '@/shared/supabase/browser';
import { env } from '@/shared/config/env';
import {
  getPaymentInvalidationKeys,
  getWithdrawalInvalidationKeys,
  isPaymentActivityPayload,
  isWithdrawalActivityPayload,
  parseWorkflowActivityPayload,
  PAYMENT_WORKFLOW_REALTIME_TOPIC,
  WITHDRAWAL_WORKFLOW_REALTIME_TOPIC,
  WORKFLOW_TRANSITION_BROADCAST_EVENT,
  type WalletRealtimeSubscriptionOptions,
} from './wallet-realtime';

export type WalletRealtimeConnectionState = 'idle' | 'connecting' | 'live' | 'offline';

export function useWalletActivitySubscription(options: WalletRealtimeSubscriptionOptions = {}) {
  const { crewUserId, paymentId, enabled = true } = options;
  const { invalidate } = useOperationalRefresh();
  const [connectionState, setConnectionState] = useState<WalletRealtimeConnectionState>('idle');
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);
  const hasSupabaseConfig = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const resolvedConnectionState: WalletRealtimeConnectionState = !enabled
    ? 'idle'
    : !hasSupabaseConfig
      ? 'offline'
      : connectionState;

  useEffect(() => {
    if (!enabled || !hasSupabaseConfig) {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    const subscribeTopic = (
      topic: string,
      matcher: (payload: unknown) => boolean,
      resolveKeys: (payload: ReturnType<typeof parseWorkflowActivityPayload>) => readonly (readonly unknown[])[],
    ) => {
      const channel = supabase.channel(topic, { config: { broadcast: { self: false } } });

      channel.on('broadcast', { event: WORKFLOW_TRANSITION_BROADCAST_EVENT }, ({ payload }) => {
        const activity = parseWorkflowActivityPayload(payload);
        if (!activity || !matcher(activity)) {
          return;
        }

        if (paymentId && activity.entity_type === 'payment' && activity.entity_id !== paymentId) {
          return;
        }

        const invalidationKeys = resolveKeys(activity);
        for (const queryKey of invalidationKeys) {
          invalidate(queryKey);
        }

        setLastActivityAt(activity.created_at);
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionState('live');
          return;
        }
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionState('offline');
          return;
        }
        setConnectionState('connecting');
      });

      return channel;
    };

    const paymentChannel = subscribeTopic(
      PAYMENT_WORKFLOW_REALTIME_TOPIC,
      isPaymentActivityPayload,
      (activity) =>
        activity ? getPaymentInvalidationKeys(activity, { crewUserId }) : [],
    );

    const withdrawalChannel = subscribeTopic(
      WITHDRAWAL_WORKFLOW_REALTIME_TOPIC,
      isWithdrawalActivityPayload,
      (activity) =>
        activity ? getWithdrawalInvalidationKeys(activity, { crewUserId, paymentId }) : [],
    );

    return () => {
      void supabase.removeChannel(paymentChannel);
      void supabase.removeChannel(withdrawalChannel);
    };
  }, [crewUserId, enabled, hasSupabaseConfig, invalidate, paymentId]);

  return {
    connectionState: resolvedConnectionState,
    lastActivityAt,
    topics: [PAYMENT_WORKFLOW_REALTIME_TOPIC, WITHDRAWAL_WORKFLOW_REALTIME_TOPIC] as const,
  };
}
