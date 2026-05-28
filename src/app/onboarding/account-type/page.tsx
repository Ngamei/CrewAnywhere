import type { Metadata } from 'next';
import { OnboardingAccountTypeScreen } from '@/modules/onboarding/components/onboarding-account-type-screen';

export const metadata: Metadata = {
  title: 'Choose account type',
};

export default function OnboardingAccountTypePage() {
  return <OnboardingAccountTypeScreen />;
}
