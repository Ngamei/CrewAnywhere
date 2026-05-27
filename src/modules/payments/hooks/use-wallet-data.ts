'use client';

import { useCallback, useMemo } from 'react';
import { fetchApi } from '@/shared/api/client';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';
import { walletQueryKeys } from './wallet-query-keys';
import type {
  PayoutStatusDisplay,
  WalletActivityFeedItem,
  WalletBalanceSummaryDto,
  WalletDto,
} from '@/modules/payments/types';

export function useWalletBalance(crewUserId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!crewUserId) throw new Error('crewUserId required');
    return fetchApi<WalletBalanceSummaryDto>(`/api/v1/wallets/${crewUserId}/balance`);
  }, [crewUserId]);

  return useOperationalFetch({
    queryKey: crewUserId ? walletQueryKeys.balance(crewUserId) : ['wallets', 'balance', 'disabled'],
    fetcher,
    enabled: Boolean(crewUserId),
  });
}

const WALLET_ACTIVITY_PAGE_SIZE = 25;

export async function fetchWalletActivityPage(
  crewUserId: string,
  options: { cursor?: string; limit?: number } = {},
) {
  const params = new URLSearchParams();
  const limit = options.limit ?? WALLET_ACTIVITY_PAGE_SIZE;
  params.set('limit', String(limit));
  if (options.cursor) {
    params.set('cursor', options.cursor);
  }

  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return fetchApi<WalletActivityFeedItem[]>(`/api/v1/wallets/${crewUserId}/activity${suffix}`);
}

export function useWalletActivity(crewUserId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!crewUserId) throw new Error('crewUserId required');
    return fetchWalletActivityPage(crewUserId);
  }, [crewUserId]);

  return useOperationalFetch({
    queryKey: crewUserId ? walletQueryKeys.activity(crewUserId) : ['wallets', 'activity', 'disabled'],
    fetcher,
    enabled: Boolean(crewUserId),
    initialData: [],
  });
}

export { WALLET_ACTIVITY_PAGE_SIZE };

export function useWalletWithdrawals(crewUserId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!crewUserId) throw new Error('crewUserId required');
    return fetchApi<PayoutStatusDisplay[]>(`/api/v1/wallets/${crewUserId}/withdrawals`);
  }, [crewUserId]);

  return useOperationalFetch({
    queryKey: crewUserId ? walletQueryKeys.withdrawals(crewUserId) : ['wallets', 'withdrawals', 'disabled'],
    fetcher,
    enabled: Boolean(crewUserId),
    initialData: [],
  });
}

export function useWallet(crewUserId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!crewUserId) throw new Error('crewUserId required');
    return fetchApi<WalletDto>(`/api/v1/wallets/${crewUserId}`);
  }, [crewUserId]);

  const result = useOperationalFetch({
    queryKey: crewUserId ? walletQueryKeys.byCrewUser(crewUserId) : ['wallets', 'crew', 'disabled'],
    fetcher,
    enabled: Boolean(crewUserId),
  });

  const payoutsEnabled = result.data?.payouts_enabled ?? false;

  return useMemo(
    () => ({
      ...result,
      payoutsEnabled,
    }),
    [payoutsEnabled, result],
  );
}
