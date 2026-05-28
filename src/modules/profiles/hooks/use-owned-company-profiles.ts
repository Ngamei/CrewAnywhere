'use client';

import { useCallback } from 'react';
import type { CompanyProfileListItemDto } from '@/modules/profiles/types';
import { profileQueryKeys } from '@/modules/profiles/hooks/profile-query-keys';
import { fetchOwnedCompanyProfiles } from '@/modules/profiles/hooks/profile-client';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';

export function useOwnedCompanyProfiles(options?: { enabled?: boolean }) {
  const fetcher = useCallback(() => fetchOwnedCompanyProfiles(), []);

  return useOperationalFetch<CompanyProfileListItemDto[]>({
    queryKey: profileQueryKeys.company.all,
    fetcher,
    enabled: options?.enabled ?? true,
  });
}
