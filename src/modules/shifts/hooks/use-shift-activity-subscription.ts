'use client';

import { useEffect, useState } from 'react';
import { useOperationalRefresh } from '@/shared/hooks/use-operational-refresh';
import { createSupabaseBrowserClient } from '@/shared/supabase/browser';
import { env } from '@/shared/config/env';
import {
  getShiftInvalidationKeys,
  parseShiftActivityPayload,
  SHIFT_WORKFLOW_BROADCAST_EVENT,
  SHIFT_WORKFLOW_REALTIME_TOPIC,
  type ShiftActivitySubscriptionOptions,
} from './shift-activity';

export type ShiftRealtimeConnectionState = 'idle' | 'connecting' | 'live' | 'offline';

export function useShiftActivitySubscription(options: ShiftActivitySubscriptionOptions = {}) {
  const { shiftId, assignmentId, enabled = true } = options;
  const { invalidate } = useOperationalRefresh();
  const [connectionState, setConnectionState] = useState<ShiftRealtimeConnectionState>('idle');
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);
  const hasSupabaseConfig = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const resolvedConnectionState: ShiftRealtimeConnectionState = !enabled
    ? 'idle'
    : !hasSupabaseConfig
      ? 'offline'
      : connectionState;

  useEffect(() => {
    if (!enabled || !hasSupabaseConfig) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(SHIFT_WORKFLOW_REALTIME_TOPIC, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: SHIFT_WORKFLOW_BROADCAST_EVENT }, ({ payload }) => {
      const activity = parseShiftActivityPayload(payload);
      if (!activity) {
        return;
      }

      if (shiftId && activity.entity_id !== shiftId) {
        return;
      }

      const invalidationKeys = getShiftInvalidationKeys(activity, { assignmentId });
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

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [assignmentId, enabled, hasSupabaseConfig, invalidate, shiftId]);

  return {
    connectionState: resolvedConnectionState,
    lastActivityAt,
    topic: SHIFT_WORKFLOW_REALTIME_TOPIC,
  };
}
