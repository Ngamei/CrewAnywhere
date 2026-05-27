'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOperationalRefresh } from '@/shared/hooks/use-operational-refresh';
import { queryKeyMatches } from '@/shared/state/operational-cache';

type UseOperationalFetchOptions<T> = {
  queryKey: readonly unknown[];
  fetcher: () => Promise<T>;
  enabled?: boolean;
  initialData?: T;
};

export function useOperationalFetch<T>({
  queryKey,
  fetcher,
  enabled = true,
  initialData,
}: UseOperationalFetchOptions<T>) {
  const { revision, wasInvalidated } = useOperationalRefresh();
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(enabled && initialData === undefined);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Request failed'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetcher]);

  useEffect(() => {
    void reload();
  }, [reload, revision]);

  const wasRefreshed = wasInvalidated(queryKey);

  return {
    data,
    isLoading,
    error,
    reload,
    wasRefreshed,
    queryKey,
  };
}

export function useOperationalQueryInvalidated(queryKey: readonly unknown[]) {
  const { wasInvalidated } = useOperationalRefresh();
  return wasInvalidated(queryKey);
}

export function matchesOperationalPrefix(prefix: readonly unknown[], queryKey: readonly unknown[]) {
  return queryKeyMatches(prefix, queryKey);
}
