'use client';

import { useCallback } from 'react';
import { fetchApi } from '@/shared/api/client';
import type { AuthSessionResponse } from '@/shared/auth/types';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';

export function usePlatformSession() {
  const fetcher = useCallback(() => fetchApi<AuthSessionResponse>('/api/v1/auth/session'), []);

  return useOperationalFetch({
    queryKey: ['auth', 'session'],
    fetcher,
  });
}
