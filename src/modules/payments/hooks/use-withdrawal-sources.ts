'use client';

import { useCallback } from 'react';
import { fetchApi } from '@/shared/api/client';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';
import { walletQueryKeys } from './wallet-query-keys';
import type { PayoutMethodDto, WithdrawalSourcePaymentDto } from '@/modules/payments/types';

export function useWithdrawalSources(crewUserId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!crewUserId) throw new Error('crewUserId required');
    return fetchApi<WithdrawalSourcePaymentDto[]>(
      `/api/v1/wallets/${crewUserId}/withdrawal-sources`,
    );
  }, [crewUserId]);

  return useOperationalFetch({
    queryKey: crewUserId
      ? [...walletQueryKeys.byCrewUser(crewUserId), 'withdrawal-sources']
      : ['wallets', 'withdrawal-sources', 'disabled'],
    fetcher,
    enabled: Boolean(crewUserId),
    initialData: [],
  });
}

export function usePayoutMethods(crewUserId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!crewUserId) throw new Error('crewUserId required');
    return fetchApi<PayoutMethodDto[]>(`/api/v1/wallets/${crewUserId}/payout-methods`);
  }, [crewUserId]);

  return useOperationalFetch({
    queryKey: crewUserId ? walletQueryKeys.payoutMethods(crewUserId) : ['wallets', 'payout-methods', 'disabled'],
    fetcher,
    enabled: Boolean(crewUserId),
    initialData: [],
  });
}
