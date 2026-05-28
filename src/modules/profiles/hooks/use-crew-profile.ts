'use client';

import { useCallback } from 'react';
import type { CrewProfileDto } from '@/modules/profiles/types';
import { profileQueryKeys } from '@/modules/profiles/hooks/profile-query-keys';
import { fetchMyCrewProfile } from '@/modules/profiles/hooks/profile-client';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';

export function useCrewProfile(options?: { enabled?: boolean }) {
  const fetcher = useCallback(() => fetchMyCrewProfile(), []);

  return useOperationalFetch<CrewProfileDto>({
    queryKey: profileQueryKeys.crew.me,
    fetcher,
    enabled: options?.enabled ?? true,
  });
}
