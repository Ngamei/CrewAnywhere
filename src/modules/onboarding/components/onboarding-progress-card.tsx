'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import type { OnboardingStep } from '@/modules/onboarding/types/operational-onboarding';

type OnboardingProgressCardProps = {
  steps: OnboardingStep[];
  overallPercent: number;
  title?: string;
  className?: string;
};

export function OnboardingProgressCard({
  steps,
  overallPercent,
  title = 'Operational onboarding',
  className,
}: OnboardingProgressCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>
              {overallPercent}% complete · {steps.filter((s) => s.complete).length} of{' '}
              {steps.length} milestones
            </CardDescription>
          </div>
          <Badge variant={overallPercent === 100 ? 'default' : 'secondary'}>{overallPercent}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={overallPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        <ol className="space-y-2" aria-label="Onboarding milestones">
          {steps.map((step) => (
            <li
              key={step.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                step.status === 'current' && 'border-primary/50 bg-primary/5',
                step.status === 'complete' && 'border-border/60 bg-muted/30',
                step.status === 'upcoming' && 'border-border',
              )}
            >
              {step.complete ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              ) : (
                <Circle
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    step.status === 'current' ? 'text-primary' : 'text-muted-foreground',
                  )}
                  aria-hidden
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{step.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              </div>
              {!step.complete ? (
                <Link
                  href={step.href as Route}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  {step.ctaLabel}
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
