import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { AuthScreenLoader } from '@/modules/onboarding/components/auth-screen-loader';
import { OnboardingRouteGuard } from '@/modules/onboarding/components/onboarding-route-guard';

type OnboardingLayoutProps = {
  children: ReactNode;
};

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <Suspense fallback={<AuthScreenLoader />}>
      <OnboardingRouteGuard mode="onboarding">{children}</OnboardingRouteGuard>
    </Suspense>
  );
}
