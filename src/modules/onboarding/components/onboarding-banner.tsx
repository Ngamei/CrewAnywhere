'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';
import type { OnboardingStep } from '@/modules/onboarding/types/operational-onboarding';

type OnboardingBannerProps = {
  nextStep: OnboardingStep | null;
  overallPercent: number;
  onDismiss: () => void;
  className?: string;
};

export function OnboardingBanner({
  nextStep,
  overallPercent,
  onDismiss,
  className,
}: OnboardingBannerProps) {
  if (!nextStep) return null;

  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      role="region"
      aria-label="Onboarding guidance"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          Onboarding · {overallPercent}% complete
        </p>
        <p className="text-sm font-semibold leading-snug">{nextStep.title}</p>
        <p className="text-xs text-muted-foreground sm:text-sm">{nextStep.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm" className="min-h-9">
          <Link href={nextStep.href as Route}>{nextStep.ctaLabel}</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={onDismiss}
          aria-label="Dismiss onboarding banner"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
