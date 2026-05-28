'use client';

import type { ReactNode } from 'react';
import { OnboardingBanner } from '@/modules/onboarding/components/onboarding-banner';
import { useOperationalOnboarding } from '@/modules/onboarding/hooks/use-operational-onboarding';

type DashboardOnboardingShellProps = {
  children: ReactNode;
};

/** Wraps dashboard routes with a dismissible onboarding banner when milestones remain. */
export function DashboardOnboardingShell({ children }: DashboardOnboardingShellProps) {
  const onboarding = useOperationalOnboarding();

  return (
    <>
      {onboarding.showDashboardBanner && onboarding.nextStep ? (
        <OnboardingBanner
          nextStep={onboarding.nextStep}
          overallPercent={onboarding.overallPercent}
          onDismiss={onboarding.dismissDashboardBanner}
        />
      ) : null}
      {children}
    </>
  );
}
