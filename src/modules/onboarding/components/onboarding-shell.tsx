'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/shared/config/site';
import { cn } from '@/shared/lib/cn';
import { ONBOARDING_ROUTES } from '@/modules/onboarding/lib/routes';

const STEPS = [
  { id: 'welcome', label: 'Welcome', href: ONBOARDING_ROUTES.start },
  { id: 'account_type', label: 'Account type', href: ONBOARDING_ROUTES.accountType },
  { id: 'complete', label: 'Finish', href: ONBOARDING_ROUTES.complete },
] as const;

type OnboardingShellProps = {
  children: ReactNode;
  title: string;
  description: string;
  activeStep: (typeof STEPS)[number]['id'];
};

export function OnboardingShell({ children, title, description, activeStep }: OnboardingShellProps) {
  const activeIndex = STEPS.findIndex((step) => step.id === activeStep);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            {APP_NAME}
          </Link>
          <p className="text-xs text-muted-foreground">First-time setup</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <nav aria-label="Onboarding progress" className="mb-8">
          <ol className="flex flex-wrap gap-2">
            {STEPS.map((step, index) => {
              const isActive = step.id === activeStep;
              const isComplete = index < activeIndex;

              return (
                <li key={step.id}>
                  <span
                    className={cn(
                      'inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium',
                      isActive && 'border-primary bg-primary text-primary-foreground',
                      isComplete && !isActive && 'border-border bg-secondary text-secondary-foreground',
                      !isActive && !isComplete && 'border-border text-muted-foreground',
                    )}
                  >
                    {index + 1}. {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
        </div>

        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
