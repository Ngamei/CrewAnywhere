'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OnboardingShell } from '@/modules/onboarding/components/onboarding-shell';
import { asAppRoute, resolveDashboardEntry } from '@/modules/onboarding/lib/routes';
import { useAuthSession } from '@/modules/onboarding/hooks/use-auth-session';
import { useOnboardingStore } from '@/modules/onboarding/state/onboarding-store';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { isPlatformSessionPayload } from '@/shared/auth/types';

export function OnboardingCompleteScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const accountType = useOnboardingStore((state) => state.accountType);
  const markComplete = useOnboardingStore((state) => state.markComplete);

  useEffect(() => {
    markComplete();
  }, [markComplete]);

  const resolvedAccountType =
    session && isPlatformSessionPayload(session)
      ? session.identity.accountType === 'crew' || session.identity.accountType === 'business'
        ? session.identity.accountType
        : accountType
      : accountType;

  const dashboardPath = resolveDashboardEntry(resolvedAccountType);

  const handleEnterDashboard = () => {
    router.push(asAppRoute(dashboardPath));
    router.refresh();
  };

  return (
    <OnboardingShell
      activeStep="complete"
      title="You are ready for the dashboard"
      description="Your onboarding progress is saved on this device. Continue to set up your operational profile."
    >
      <Card>
        <CardHeader>
          <CardTitle>Setup complete</CardTitle>
          <CardDescription>
            {resolvedAccountType === 'crew'
              ? 'Head to your crew profile to finish marketplace readiness.'
              : resolvedAccountType === 'business'
                ? 'Head to your company profile to publish jobs and manage operations.'
                : 'Open the dashboard to continue platform setup.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Platform identity linking runs separately from this UX flow. When your account is provisioned in the
            database, we will route you automatically on your next sign-in.
          </p>
          <Button type="button" className="w-full sm:w-auto" onClick={handleEnterDashboard}>
            Enter dashboard
          </Button>
        </CardContent>
      </Card>
    </OnboardingShell>
  );
}
