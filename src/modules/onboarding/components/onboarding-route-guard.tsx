'use client';

import type { ReactNode } from 'react';
import { AuthScreenLoader } from '@/modules/onboarding/components/auth-screen-loader';
import { useAuthRedirect } from '@/modules/onboarding/hooks/use-auth-redirect';
import { useAuthSession } from '@/modules/onboarding/hooks/use-auth-session';

type OnboardingRouteGuardProps = {
  children: ReactNode;
  mode: 'auth' | 'onboarding';
};

export function OnboardingRouteGuard({ children, mode }: OnboardingRouteGuardProps) {
  const { isLoading } = useAuthSession();
  useAuthRedirect({ mode });

  if (isLoading) {
    return <AuthScreenLoader />;
  }

  return <>{children}</>;
}
