'use client';

import { useCallback, useMemo, useState } from 'react';
import { useCrewWalletContext } from './use-crew-wallet-context';
import {
  fetchWalletActivityPage,
  useWallet,
  useWalletActivity,
  useWalletBalance,
  useWalletWithdrawals,
  WALLET_ACTIVITY_PAGE_SIZE,
} from './use-wallet-data';
import { useWalletRefresh } from './use-wallet-refresh';
import { useWalletActivitySubscription } from './use-wallet-activity-subscription';
import type { WalletActivityFeedItem } from '@/modules/payments/types';

export function useWalletOperational() {
  const { crewUserId, isCrewAccount, isSessionLoading, sessionError, reloadSession } =
    useCrewWalletContext();

  const walletQuery = useWallet(crewUserId);
  const balanceQuery = useWalletBalance(crewUserId);
  const activityQuery = useWalletActivity(crewUserId);
  const withdrawalsQuery = useWalletWithdrawals(crewUserId);
  const { refreshWallet: invalidateWalletQueries } = useWalletRefresh(crewUserId);
  const realtime = useWalletActivitySubscription({
    crewUserId,
    enabled: Boolean(crewUserId),
  });

  const isLoading =
    isSessionLoading ||
    walletQuery.isLoading ||
    balanceQuery.isLoading ||
    activityQuery.isLoading ||
    withdrawalsQuery.isLoading;

  const hasWalletData = Boolean(balanceQuery.data ?? walletQuery.data);
  const isInitialLoading = isLoading && !hasWalletData;
  const isRefreshing = isLoading && hasWalletData;

  const error =
    sessionError ??
    walletQuery.error ??
    balanceQuery.error ??
    activityQuery.error ??
    withdrawalsQuery.error ??
    null;

  const activeWithdrawals = useMemo(
    () => (withdrawalsQuery.data ?? []).filter((withdrawal) => !withdrawal.isTerminal),
    [withdrawalsQuery.data],
  );

  const [activityTail, setActivityTail] = useState<WalletActivityFeedItem[]>([]);
  const [hasMoreFromLoad, setHasMoreFromLoad] = useState<boolean | null>(null);
  const [isLoadingMoreActivity, setIsLoadingMoreActivity] = useState(false);
  const [activityLoadMoreError, setActivityLoadMoreError] = useState<Error | null>(null);

  const headActivity = activityQuery.data ?? [];
  const hasMoreActivity =
    hasMoreFromLoad ?? headActivity.length >= WALLET_ACTIVITY_PAGE_SIZE;

  const activity = useMemo(() => {
    const merged = [...headActivity, ...activityTail];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [activityTail, headActivity]);

  const refreshWallet = useCallback(() => {
    setActivityTail([]);
    setHasMoreFromLoad(null);
    setActivityLoadMoreError(null);
    invalidateWalletQueries();
  }, [invalidateWalletQueries]);

  const loadMoreActivity = useCallback(async () => {
    if (!crewUserId) return;

    const lastItem = activity.at(-1);
    if (!lastItem) return;

    setIsLoadingMoreActivity(true);
    setActivityLoadMoreError(null);

    try {
      const page = await fetchWalletActivityPage(crewUserId, { cursor: lastItem.timestamp });
      const existingIds = new Set(activity.map((item) => item.id));
      const next = page.filter((item) => !existingIds.has(item.id));
      setActivityTail((prev) => [...prev, ...next]);
      setHasMoreFromLoad(page.length >= WALLET_ACTIVITY_PAGE_SIZE);
    } catch (cause) {
      setActivityLoadMoreError(cause instanceof Error ? cause : new Error('Failed to load more activity'));
    } finally {
      setIsLoadingMoreActivity(false);
    }
  }, [activity, crewUserId]);

  return {
    crewUserId,
    isCrewAccount,
    isSessionLoading,
    isLoading,
    isInitialLoading,
    isRefreshing,
    error,
    wallet: walletQuery.data,
    balance: balanceQuery.data,
    activity,
    canLoadMoreActivity: hasMoreActivity && activity.length > 0,
    loadMoreActivity,
    isLoadingMoreActivity,
    activityLoadMoreError,
    withdrawals: withdrawalsQuery.data ?? [],
    activeWithdrawals,
    payoutsEnabled: walletQuery.payoutsEnabled,
    refreshWallet,
    reloadSession,
    realtime,
    wasRefreshed:
      balanceQuery.wasRefreshed ||
      activityQuery.wasRefreshed ||
      withdrawalsQuery.wasRefreshed ||
      walletQuery.wasRefreshed,
  };
}
