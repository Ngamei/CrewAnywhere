'use client';

import { useEffect, useMemo } from 'react';
import {
  isIdentityPendingSession,
  isPlatformSessionPayload,
  type AuthSessionResponse,
} from '@/shared/auth/types';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';
import { syncOnboardingCookies } from '@/modules/onboarding/lib/onboarding-storage';
import { useOnboardingStore } from '@/modules/onboarding/state/onboarding-store';
import type { OnboardingAccountType } from '@/modules/onboarding/types';

function syncOnboardingCookiesFromStore() {
  const state = useOnboardingStore.getState();
  syncOnboardingCookies(state);
}

export function useAuthSession() {
  const { data, isLoading, error, reload } = usePlatformSession();
  const syncFromServerAccountType = useOnboardingStore((state) => state.syncFromServerAccountType);
  const markComplete = useOnboardingStore((state) => state.markComplete);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const setHydrated = useOnboardingStore((state) => state.setHydrated);

  const session = data as AuthSessionResponse | undefined;

  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
      syncOnboardingCookiesFromStore();
    }
  }, [hydrated, setHydrated]);

  const isAuthenticated = Boolean(session?.authenticated);
  const hasPlatformIdentity = Boolean(session && isPlatformSessionPayload(session));
  const isIdentityPending = Boolean(session && isIdentityPendingSession(session));

  const platformAccountType = useMemo((): OnboardingAccountType | null => {
    if (!session || !isPlatformSessionPayload(session)) {
      return null;
    }

    const { accountType } = session.identity;
    if (accountType === 'crew' || accountType === 'business') {
      return accountType;
    }

    return null;
  }, [session]);

  useEffect(() => {
    if (!platformAccountType) {
      return;
    }

    syncFromServerAccountType(platformAccountType);
    markComplete();
  }, [markComplete, platformAccountType, syncFromServerAccountType]);

  return {
    session,
    isLoading: isLoading || !hydrated,
    error,
    reload,
    isAuthenticated,
    hasPlatformIdentity,
    isIdentityPending,
    platformAccountType,
  };
}
