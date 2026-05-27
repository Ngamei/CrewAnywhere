'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  invalidateOperationalQueries,
  queryKeyMatches,
  subscribeOperationalInvalidation,
} from '@/shared/state/operational-cache';

export function useOperationalRefresh() {
  const router = useRouter();
  const [revision, setRevision] = useState(0);
  const [invalidatedKeys, setInvalidatedKeys] = useState<readonly (readonly unknown[])[]>([]);

  useEffect(() => {
    return subscribeOperationalInvalidation((queryKey) => {
      setInvalidatedKeys((current) => [...current, queryKey]);
      setRevision((value) => value + 1);
    });
  }, []);

  const refresh = useCallback(() => {
    router.refresh();
    setRevision((value) => value + 1);
  }, [router]);

  const invalidate = useCallback((queryKey: readonly unknown[]) => {
    invalidateOperationalQueries(queryKey);
    router.refresh();
  }, [router]);

  const wasInvalidated = useCallback(
    (queryKey: readonly unknown[]) =>
      invalidatedKeys.some((invalidated) => queryKeyMatches(queryKey, invalidated)),
    [invalidatedKeys],
  );

  return {
    revision,
    refresh,
    invalidate,
    wasInvalidated,
  };
}
