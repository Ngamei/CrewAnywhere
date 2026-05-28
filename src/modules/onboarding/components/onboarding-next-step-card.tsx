'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import type { OnboardingStep } from '@/modules/onboarding/types/operational-onboarding';

type OnboardingNextStepCardProps = {
  nextStep: OnboardingStep | null;
  isOnboardingComplete?: boolean;
  className?: string;
};

export function OnboardingNextStepCard({
  nextStep,
  isOnboardingComplete = false,
  className,
}: OnboardingNextStepCardProps) {
  if (isOnboardingComplete) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-base">You&apos;re operationally activated</CardTitle>
          </div>
          <CardDescription>
            Core onboarding milestones are complete. Explore marketplace, shifts, and wallet flows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href={'/dashboard/activity' as Route}>View activity</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!nextStep) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Suggested next step
        </p>
        <CardTitle className="text-lg">{nextStep.title}</CardTitle>
        <CardDescription>{nextStep.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full sm:w-auto">
          <Link href={nextStep.href as Route}>
            {nextStep.ctaLabel}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
