'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AccountTypeSelector } from '@/modules/onboarding/components/account-type-selector';
import { AuthFormFeedback } from '@/modules/onboarding/components/auth-form-feedback';
import { OnboardingShell } from '@/modules/onboarding/components/onboarding-shell';
import { asAppRoute, ONBOARDING_ROUTES } from '@/modules/onboarding/lib/routes';
import { useOnboardingStore } from '@/modules/onboarding/state/onboarding-store';
import type { OnboardingAccountType } from '@/modules/onboarding/types';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export function OnboardingAccountTypeScreen() {
  const router = useRouter();
  const storedAccountType = useOnboardingStore((state) => state.accountType);
  const setAccountType = useOnboardingStore((state) => state.setAccountType);
  const [selected, setSelected] = useState<OnboardingAccountType | null>(storedAccountType);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) {
      setError('Select crew or business to continue.');
      return;
    }

    setError(null);
    setAccountType(selected);
    router.push(asAppRoute(ONBOARDING_ROUTES.complete));
  };

  return (
    <OnboardingShell
      activeStep="account_type"
      title="How will you use CrewAnywhere?"
      description="This sets your default dashboard path. You can complete detailed profiles after onboarding."
    >
      <Card>
        <CardHeader>
          <CardTitle>Account type</CardTitle>
          <CardDescription>Pick the experience that matches how you work on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthFormFeedback error={error} />
          <AccountTypeSelector value={selected} onChange={setSelected} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => router.push(asAppRoute(ONBOARDING_ROUTES.start))}>
              Back
            </Button>
            <Button type="button" onClick={handleContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </OnboardingShell>
  );
}
