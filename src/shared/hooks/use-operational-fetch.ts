'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOperationalRefresh } from '@/shared/hooks/use-operational-refresh';

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
  const [fetchGeneration, setFetchGeneration] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, [reload, revision]);
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause : new Error('Request failed'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, fetcher, revision, fetchGeneration]);

  const reload = useCallback(() => {
    setFetchGeneration((value) => value + 1);
  }, []);

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
