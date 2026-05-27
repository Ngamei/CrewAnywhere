'use client';

import { useCallback } from 'react';
import { useOperationalRefresh } from '@/shared/hooks/use-operational-refresh';
import { walletQueryKeys } from './wallet-query-keys';

/** Invalidates wallet balance, activity, and withdrawal queries for a crew user. */
export function useWalletRefresh(crewUserId: string | undefined) {
  const { invalidate, refresh } = useOperationalRefresh();

  const refreshWallet = useCallback(() => {
    if (!crewUserId) {
      refresh();
      return;
    }

    invalidate(walletQueryKeys.byCrewUser(crewUserId));
    invalidate(walletQueryKeys.balance(crewUserId));
    invalidate(walletQueryKeys.activity(crewUserId));
    invalidate(walletQueryKeys.withdrawals(crewUserId));
  }, [crewUserId, invalidate, refresh]);

  return { refreshWallet, invalidate, refresh };
}
