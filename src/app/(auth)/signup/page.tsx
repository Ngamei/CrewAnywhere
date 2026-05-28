import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthScreenLoader } from '@/modules/onboarding/components/auth-screen-loader';
import { SignupForm } from '@/modules/onboarding/components/signup-form';

export const metadata: Metadata = {
  title: 'Create account',
};

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthScreenLoader />}>
      <SignupForm />
    </Suspense>
  );
}
