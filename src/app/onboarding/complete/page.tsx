import type { Metadata } from 'next';
import { OnboardingCompleteScreen } from '@/modules/onboarding/components/onboarding-complete-screen';

export const metadata: Metadata = {
  title: 'Onboarding complete',
};

export default function OnboardingCompletePage() {
  return <OnboardingCompleteScreen />;
}
