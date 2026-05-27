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

export function useWalletActivity(crewUserId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!crewUserId) throw new Error('crewUserId required');
    return fetchApi<WalletActivityFeedItem[]>(`/api/v1/wallets/${crewUserId}/activity`);
  }, [crewUserId]);

  return useOperationalFetch({
    queryKey: crewUserId ? walletQueryKeys.activity(crewUserId) : ['wallets', 'activity', 'disabled'],
    fetcher,
    enabled: Boolean(crewUserId),
    initialData: [],
  });
}

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
