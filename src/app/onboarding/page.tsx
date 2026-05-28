import type { Metadata } from 'next';
import { OnboardingWelcomeScreen } from '@/modules/onboarding/components/onboarding-welcome-screen';

export const metadata: Metadata = {
  title: 'Onboarding',
};

export default function OnboardingPage() {
  return <OnboardingWelcomeScreen />;
}
