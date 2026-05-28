'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Building2, UserCircle } from 'lucide-react';
import { ProfileHubOnboardingPrompt } from '@/modules/onboarding';
import { MissingRequirementsList } from '@/modules/profiles/components/missing-requirements-list';
import { ProfileProgressBar } from '@/modules/profiles/components/profile-progress-bar';
import { ReadinessIndicator } from '@/modules/profiles/components/readiness-indicator';
import { useOwnedCompanyProfiles } from '@/modules/profiles/hooks/use-owned-company-profiles';
import { useProfileReadiness } from '@/modules/profiles/hooks/use-profile-readiness';
import type { ProfileReadinessSnapshot } from '@/modules/profiles/types/profile-workflow';
import { AsyncBoundary } from '@/shared/components/operational/retry-ui';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

function ProfileHubCard({
  href,
  icon: Icon,
  title,
  description,
  percent,
  snapshot,
  isLoading,
}: {
  href: Route;
  icon: typeof Building2;
  title: string;
  description: string;
  percent: number | null;
  snapshot: ProfileReadinessSnapshot | null;
  isLoading: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <Icon className="size-8 text-muted-foreground" aria-hidden />
            {snapshot ? <ReadinessIndicator snapshot={snapshot} compact /> : null}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <FormSectionSkeleton rows={2} />
          ) : (
            <>
              <ProfileProgressBar percent={percent ?? 0} label="Completion" />
              {snapshot ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant={snapshot.completion.operationalReady ? 'default' : 'outline'}>
                    {snapshot.completion.operationalReady ? 'Operational' : 'In progress'}
                  </Badge>
                  {snapshot.completion.verificationReady ? (
                    <Badge variant="secondary">Verification ready</Badge>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sign in to view progress.</p>
              )}
              {snapshot ? (
                <MissingRequirementsList sections={snapshot.completion.sections} title="Still needed" />
              ) : null}
            </>
          )}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
            Continue
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ProfileHubScreen() {
  const crewReadiness = useProfileReadiness('crew');
  const ownedCompanies = useOwnedCompanyProfiles();
  const primaryCompanyId = ownedCompanies.data?.[0]?.id ?? null;
  const companyReadiness = useProfileReadiness(
    primaryCompanyId ? { companyProfileId: primaryCompanyId } : { companyProfileId: '' },
  );

  const isInitialLoading = crewReadiness.isLoading || ownedCompanies.isLoading;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Track onboarding progress for your business and crew profiles.
        </p>
      </div>

      <ProfileHubOnboardingPrompt />

      <AsyncBoundary
        isLoading={isInitialLoading}
        error={crewReadiness.error ?? ownedCompanies.error?.message ?? null}
        onRetry={() => {
          crewReadiness.refresh();
          ownedCompanies.reload();
        }}
        loadingFallback={
          <div className="grid gap-4 md:grid-cols-2">
            <FormSectionSkeleton rows={5} />
            <FormSectionSkeleton rows={5} />
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileHubCard
            href={'/dashboard/profile/crew' as Route}
            icon={UserCircle}
            title="Crew profile"
            description="Skills, experience, KYC readiness, and marketplace publish state."
            percent={crewReadiness.snapshot?.completion.percentComplete ?? null}
            snapshot={crewReadiness.snapshot}
            isLoading={crewReadiness.isLoading}
          />
          <ProfileHubCard
            href={'/dashboard/profile/company' as Route}
            icon={Building2}
            title="Company profile"
            description="Business identity, KYB verification, finance setup, and operational flags."
            percent={companyReadiness.snapshot?.completion.percentComplete ?? null}
            snapshot={companyReadiness.snapshot}
            isLoading={ownedCompanies.isLoading || companyReadiness.isLoading}
          />
        </div>
      </AsyncBoundary>
    </section>
  );
}
