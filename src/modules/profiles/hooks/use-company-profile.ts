'use client';

import { useCallback } from 'react';
import type { CompanyProfileDto } from '@/modules/profiles/types';
import { profileQueryKeys } from '@/modules/profiles/hooks/profile-query-keys';
import { fetchCompanyProfile } from '@/modules/profiles/hooks/profile-client';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';

export function useCompanyProfile(companyProfileId: string | null, options?: { enabled?: boolean }) {
  const fetcher = useCallback(
    () => fetchCompanyProfile(companyProfileId as string),
    [companyProfileId],
  );

  return useOperationalFetch<CompanyProfileDto>({
    queryKey: profileQueryKeys.company.detail(companyProfileId ?? ''),
    fetcher,
    enabled: (options?.enabled ?? true) && Boolean(companyProfileId),
  });
}
