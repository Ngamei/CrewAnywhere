'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/shared/supabase/browser';
import { env } from '@/shared/config/env';
import type { WorkflowEventPayload } from '@/shared/events';
import { useNotificationStore } from '@/modules/notifications/state/notification-store';
import {
  canRoleSeeEntityType,
  mapWorkflowPayloadToNotification,
} from './notification-event-mappers';

export type NotificationRealtimeState = 'idle' | 'connecting' | 'live' | 'offline';

const WORKFLOW_TRANSITION_BROADCAST_EVENT = 'workflow_transition';

const WORKFLOW_TOPICS = [
  'workflow.proposals',
  'workflow.hiring',
  'workflow.assignments',
  'workflow.shifts',
  'workflow.payments',
  'workflow.withdrawals',
  'workflow.onboarding',
  'workflow.profiles',
] as const;

function parsePayload(value: unknown): WorkflowEventPayload | null {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Record<string, unknown>;
  if (
    typeof payload.workflow_event_id !== 'string' ||
    typeof payload.entity_type !== 'string' ||
    typeof payload.entity_id !== 'string' ||
    typeof payload.to_status !== 'string' ||
    typeof payload.transition_source !== 'string' ||
    typeof payload.created_at !== 'string'
  ) {
    return null;
  }
  return payload as WorkflowEventPayload;
}

export function useNotificationRealtimeSubscription({
  enabled = true,
  role,
}: {
  enabled?: boolean;
  role?: string;
} = {}) {
  const [connectionState, setConnectionState] = useState<NotificationRealtimeState>('idle');
  const push = useNotificationStore((state) => state.push);
  const hasSupabaseConfig = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    if (!enabled || !hasSupabaseConfig) return;

    const supabase = createSupabaseBrowserClient();
    const channels = WORKFLOW_TOPICS.map((topic) => {
      const channel = supabase.channel(topic, { config: { broadcast: { self: false } } });
      channel.on('broadcast', { event: WORKFLOW_TRANSITION_BROADCAST_EVENT }, ({ payload }) => {
        const parsed = parsePayload(payload);
        if (!parsed || !canRoleSeeEntityType(parsed.entity_type, role)) return;
        push(mapWorkflowPayloadToNotification(parsed));
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
    });

    return () => {
      for (const channel of channels) {
        void supabase.removeChannel(channel);
      }
    };
  }, [enabled, hasSupabaseConfig, push, role]);

  if (!enabled) return { connectionState: 'idle' as const, topics: WORKFLOW_TOPICS };
  if (!hasSupabaseConfig) return { connectionState: 'offline' as const, topics: WORKFLOW_TOPICS };
  return { connectionState, topics: WORKFLOW_TOPICS };
}

