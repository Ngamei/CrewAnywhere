'use client';

import { useCallback } from 'react';
import type { ProfileReadinessSnapshot } from '@/modules/profiles/types/profile-workflow';
import { profileQueryKeys } from '@/modules/profiles/hooks/profile-query-keys';
import type { ApiSuccess } from '@/shared/api/responses';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';

type ProfileReadinessTarget = 'crew' | { companyProfileId: string };

type UseProfileReadinessResult = {
  snapshot: ProfileReadinessSnapshot | null;
  isLoading: boolean;
  error: string | null;
  isRetrying: boolean;
  refresh: () => void;
};

export function useProfileReadiness(target: ProfileReadinessTarget): UseProfileReadinessResult {
  const companyProfileId = target === 'crew' ? null : target.companyProfileId;
  const enabled = target === 'crew' || Boolean(companyProfileId);

  const endpoint =
    target === 'crew'
      ? '/api/v1/crew-profiles/readiness'
      : `/api/v1/company-profiles/${companyProfileId}/readiness`;

  const queryKey =
    target === 'crew'
      ? profileQueryKeys.crew.readiness
      : profileQueryKeys.company.readiness(companyProfileId ?? '');

  const fetcher = useCallback(async (): Promise<ProfileReadinessSnapshot> => {
    const response = await fetch(endpoint, { credentials: 'include' });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: { message?: string } };
      throw new Error(body?.error?.message ?? `Failed to load readiness (${response.status})`);
    }
    const json = (await response.json()) as ApiSuccess<ProfileReadinessSnapshot>;
    return json.data;
  }, [endpoint]);

  const { data, isLoading, error, reload } = useOperationalFetch({
    queryKey,
    fetcher,
    enabled,
  });

  return {
    snapshot: data ?? null,
    isLoading,
    error: error?.message ?? null,
    isRetrying: false,
    refresh: () => void reload(),
  };
}
