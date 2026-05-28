'use client';

import { useMemo } from 'react';
import { isPlatformSessionPayload } from '@/shared/auth/types';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';

/** Resolves the authenticated crew user id for wallet routes (crew accounts only). */
export function useCrewWalletContext() {
  const sessionQuery = usePlatformSession();
  const identity =
    sessionQuery.data && isPlatformSessionPayload(sessionQuery.data) ? sessionQuery.data.identity : null;
  const crewUserId = identity?.crewUserId ?? undefined;
  const isCrewAccount = identity?.accountType === 'crew';

  return useMemo(
    () => ({
      crewUserId,
      isCrewAccount,
      session: sessionQuery.data,
      isSessionLoading: sessionQuery.isLoading,
      sessionError: sessionQuery.error,
      reloadSession: sessionQuery.reload,
    }),
    [
      crewUserId,
      isCrewAccount,
      sessionQuery.data,
      sessionQuery.error,
      sessionQuery.isLoading,
      sessionQuery.reload,
    ],
  );
}
