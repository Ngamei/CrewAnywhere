'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Activity, Building2, Clock3, HandCoins, UserCircle, Wallet } from 'lucide-react';
import { OnboardingNextStepCard } from '@/modules/onboarding/components/onboarding-next-step-card';
import { OnboardingProgressCard } from '@/modules/onboarding/components/onboarding-progress-card';
import { useOperationalOnboarding } from '@/modules/onboarding/hooks/use-operational-onboarding';
import { useNotifications } from '@/modules/notifications/hooks';
import { ReadinessIndicator } from '@/modules/profiles/components/readiness-indicator';
import { AsyncBoundary } from '@/shared/components/operational';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { isBusinessActor, isCrewActor } from '@/shared/auth/roles';
import { getDemoDashboardMetrics } from '@/shared/demo/operational-demo-data';

export function DashboardOnboardingHub() {
  const onboarding = useOperationalOnboarding();
  const { notifications } = useNotifications();
  const metrics = getDemoDashboardMetrics();
  const realtimeCount = notifications.filter((item) => item.status === 'unread').length;

  const quickLinks = [
    {
      show: isCrewActor(onboarding.role),
      href: '/dashboard/profile/crew' as Route,
      icon: UserCircle,
      title: 'Crew profile',
      description: 'Skills, KYC, and marketplace publish readiness.',
    },
    {
      show: isBusinessActor(onboarding.role),
      href: '/dashboard/profile/company' as Route,
      icon: Building2,
      title: 'Company profile',
      description: 'KYB, billing setup, and business operational flags.',
    },
    {
      show: isCrewActor(onboarding.role),
      href: '/dashboard/wallet' as Route,
      icon: Wallet,
      title: 'Wallet',
      description: 'Balances, payouts, and withdrawal requests.',
    },
  ].filter((item) => item.show);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Operations</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Operational dashboard</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Complete onboarding milestones to activate events, marketplace, shifts, and payments.
            </p>
          </div>
          {onboarding.snapshot ? (
            <ReadinessIndicator snapshot={onboarding.snapshot} compact />
          ) : null}
        </div>
      </section>

      <AsyncBoundary
        isLoading={onboarding.isReadinessLoading}
        error={onboarding.readinessError}
        onRetry={onboarding.refreshReadiness}
        loadingFallback={<FormSectionSkeleton rows={4} />}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active jobs</CardDescription>
              <CardTitle className="text-2xl">{metrics.activeJobs}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Proposal pipeline</CardDescription>
              <CardTitle className="text-2xl">{metrics.activeProposals}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active shifts</CardDescription>
              <CardTitle className="text-2xl">{metrics.activeShifts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Upcoming shifts (24h)</CardDescription>
              <CardTitle className="text-2xl">{metrics.upcomingShifts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending payouts</CardDescription>
              <CardTitle className="text-2xl">{metrics.pendingPayouts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Onboarding completion</CardDescription>
              <CardTitle className="text-2xl">{Math.max(onboarding.overallPercent, metrics.onboardingCompletionPercent)}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational realtime summary</CardTitle>
            <CardDescription>Live domain awareness from notifications and workflow updates.</CardDescription>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Activity className="size-3.5" />
                {realtimeCount} unread events
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock3 className="size-3.5" />
                {metrics.upcomingShifts} shifts require staffing attention
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <HandCoins className="size-3.5" />
                {metrics.pendingPayouts} payouts in progress
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <OnboardingNextStepCard
            nextStep={onboarding.nextStep}
            isOnboardingComplete={onboarding.isOnboardingComplete}
            className="lg:order-2"
          />
          <OnboardingProgressCard
            steps={onboarding.steps}
            overallPercent={onboarding.overallPercent}
            className="lg:order-1"
          />
        </div>
      </AsyncBoundary>

      {quickLinks.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <link.icon className="mb-2 size-6 text-muted-foreground" aria-hidden />
                  <CardTitle className="text-base">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
