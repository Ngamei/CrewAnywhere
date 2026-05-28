'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { asAppRoute } from '@/modules/onboarding/lib/routes';
import { resolveAuthRedirectTarget, shouldBlockAuthPage } from '@/modules/onboarding/lib/redirect-target';
import { useAuthSession } from '@/modules/onboarding/hooks/use-auth-session';
import { useOnboardingStore } from '@/modules/onboarding/state/onboarding-store';

type UseAuthRedirectOptions = {
  mode: 'auth' | 'onboarding' | 'none';
};

/**
 * Client-side guard for auth and onboarding routes when middleware cookies are not yet synced.
 */
export function useAuthRedirect({ mode }: UseAuthRedirectOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading, isAuthenticated } = useAuthSession();
  const onboarding = useOnboardingStore((state) => ({
    accountType: state.accountType,
    currentStep: state.currentStep,
    isComplete: state.isComplete,
    completedAt: state.completedAt,
  }));

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const nextParam = searchParams.get('next');

    if (mode === 'auth' && shouldBlockAuthPage(session)) {
      const target = resolveAuthRedirectTarget({ session, onboarding, nextParam });
      router.replace(asAppRoute(target));
      return;
    }

    if (mode === 'onboarding') {
      if (!isAuthenticated) {
        router.replace(asAppRoute(`/login?next=${encodeURIComponent('/onboarding')}`));
        return;
      }

      if (onboarding.isComplete && session && 'identity' in session) {
        const target = resolveAuthRedirectTarget({ session, onboarding, nextParam });
        router.replace(asAppRoute(target));
      }
    }
  }, [isAuthenticated, isLoading, mode, onboarding, router, searchParams, session]);
}
