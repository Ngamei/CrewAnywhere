import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { AuthLayoutShell } from '@/modules/onboarding/components/auth-layout-shell';
import { AuthScreenLoader } from '@/modules/onboarding/components/auth-screen-loader';
import { OnboardingRouteGuard } from '@/modules/onboarding/components/onboarding-route-guard';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthLayoutShell
      marketingTitle="Operate crew and events with confidence"
      marketingDescription="Sign in or create an account to access your CrewAnywhere workspace."
    >
      <Suspense fallback={<AuthScreenLoader />}>
        <OnboardingRouteGuard mode="auth">{children}</OnboardingRouteGuard>
      </Suspense>
    </AuthLayoutShell>
  );
}
