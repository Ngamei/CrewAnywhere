'use client';

import { useEffect, useState } from 'react';
import { useOperationalRefresh } from '@/shared/hooks/use-operational-refresh';
import { createSupabaseBrowserClient } from '@/shared/supabase/browser';
import { env } from '@/shared/config/env';

type UseProposalActivitySubscriptionOptions = {
  enabled?: boolean;
  proposalId?: string | null;
  jobId?: string | null;
};

type ProposalActivityPayload = {
  entity_type?: string;
  entity_id?: string;
  workflow_event_id?: string;
  created_at?: string;
};

export type ProposalRealtimeConnectionState = 'idle' | 'connecting' | 'live' | 'offline';

const PROPOSAL_REALTIME_TOPIC = 'workflow.proposals';
const PROPOSAL_BROADCAST_EVENT = 'workflow_transition';

function parseProposalActivityPayload(payload: unknown): ProposalActivityPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  return payload as ProposalActivityPayload;
}

export function useProposalActivitySubscription(options: UseProposalActivitySubscriptionOptions = {}) {
  const { enabled = true, proposalId = null, jobId = null } = options;
  const { invalidate } = useOperationalRefresh();
  const [connectionState, setConnectionState] = useState<ProposalRealtimeConnectionState>('idle');
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);
  const hasSupabaseConfig = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const resolvedConnectionState: ProposalRealtimeConnectionState = !enabled
    ? 'idle'
    : !hasSupabaseConfig
      ? 'offline'
      : connectionState;

  useEffect(() => {
    if (!enabled || !hasSupabaseConfig) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(PROPOSAL_REALTIME_TOPIC, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: PROPOSAL_BROADCAST_EVENT }, ({ payload }) => {
      const activity = parseProposalActivityPayload(payload);
      if (!activity || activity.entity_type !== 'proposal') return;

      if (proposalId && activity.entity_id !== proposalId) {
        return;
      }

      invalidate(['proposal', 'list', 'crew']);
      if (proposalId) {
        invalidate(['proposal', 'detail', proposalId]);
        invalidate(['proposal', 'timeline', proposalId]);
      }
      if (jobId) {
        invalidate(['proposal', 'list', 'job', jobId]);
      }
      setLastActivityAt(activity.created_at ?? new Date().toISOString());
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
  }, [enabled, hasSupabaseConfig, invalidate, jobId, proposalId]);

  return {
    connectionState: resolvedConnectionState,
    lastActivityAt,
    topic: PROPOSAL_REALTIME_TOPIC,
  };
}
