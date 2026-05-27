'use client';

import type { ReactNode } from 'react';
import { OnboardingProgressIndicator } from '@/modules/profiles/components/onboarding-progress-indicator';
import { ProfileCompletionIndicator } from '@/modules/profiles/components/profile-completion-indicator';
import { ReadinessIndicator } from '@/modules/profiles/components/readiness-indicator';
import { useProfileReadiness } from '@/modules/profiles/hooks/use-profile-readiness';
import { AsyncBoundary } from '@/shared/components/operational/retry-ui';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';

type ProfileOnboardingShellProps = {
  profileType: 'crew' | 'company';
  companyProfileId?: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function ProfileOnboardingShell({
  profileType,
  companyProfileId,
  title,
  description,
  children,
}: ProfileOnboardingShellProps) {
  const target =
    profileType === 'crew' ? 'crew' : { companyProfileId: companyProfileId ?? '' };

  const { snapshot, isLoading, error, isRetrying, refresh } = useProfileReadiness(target);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {snapshot ? <ReadinessIndicator snapshot={snapshot} compact /> : null}
      </div>

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        onRetry={refresh}
        isRetrying={isRetrying}
        loadingFallback={<FormSectionSkeleton rows={4} />}
      >
        {snapshot ? (
          <>
            <OnboardingProgressIndicator
              snapshot={snapshot}
              title={profileType === 'crew' ? 'Crew onboarding' : 'Company onboarding'}
            />
            <ProfileCompletionIndicator
              title={profileType === 'crew' ? 'Crew readiness' : 'Company readiness'}
              completion={snapshot.completion}
            />
            {children}
          </>
        ) : (
          <OperationalEmptyState
            variant="profile"
            title="Profile not available"
            description="Complete sign-in or create a profile to continue onboarding."
            actionLabel="Retry"
            onAction={refresh}
          />
        )}
      </AsyncBoundary>
    </section>
  );
}
