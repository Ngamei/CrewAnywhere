'use client';

import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/modules/onboarding/components/onboarding-shell';
import { asAppRoute, ONBOARDING_ROUTES } from '@/modules/onboarding/lib/routes';
import { useOnboardingStore } from '@/modules/onboarding/state/onboarding-store';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export function OnboardingWelcomeScreen() {
  const router = useRouter();
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);

  const handleContinue = () => {
    setCurrentStep('welcome');
    router.push(asAppRoute(ONBOARDING_ROUTES.accountType));
  };

  return (
    <OnboardingShell
      activeStep="welcome"
      title="Welcome to CrewAnywhere"
      description="We will set up your account type and prepare your operational workspace."
    >
      <Card>
        <CardHeader>
          <CardTitle>What happens next</CardTitle>
          <CardDescription>Three quick steps before you reach the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Choose whether you are joining as crew or business.</li>
            <li>Confirm your setup and sync your session.</li>
            <li>Continue to profile and operations in the dashboard.</li>
          </ol>
          <Button type="button" className="w-full sm:w-auto" onClick={handleContinue}>
            Continue
          </Button>
        </CardContent>
      </Card>
    </OnboardingShell>
  );
}
