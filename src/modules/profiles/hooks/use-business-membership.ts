'use client';

import { useCallback } from 'react';
import type { BusinessMembershipDto } from '@/modules/profiles/types';
import { profileQueryKeys } from '@/modules/profiles/hooks/profile-query-keys';
import { fetchBusinessMembership } from '@/modules/profiles/hooks/profile-client';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';

export function useBusinessMembership(options?: { enabled?: boolean }) {
  const fetcher = useCallback(() => fetchBusinessMembership(), []);

  return useOperationalFetch<BusinessMembershipDto>({
    queryKey: profileQueryKeys.membership.current,
    fetcher,
    enabled: options?.enabled ?? true,
  });
}
