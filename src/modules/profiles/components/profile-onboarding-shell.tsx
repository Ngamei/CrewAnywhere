'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { OnboardingProgressIndicator } from '@/modules/profiles/components/onboarding-progress-indicator';
import { MissingRequirementsList } from '@/modules/profiles/components/missing-requirements-list';
import { ProfileCompletionIndicator } from '@/modules/profiles/components/profile-completion-indicator';
import { ReadinessIndicator } from '@/modules/profiles/components/readiness-indicator';
import { useProfileReadiness } from '@/modules/profiles/hooks/use-profile-readiness';
import type { ProfileReadinessSnapshot } from '@/modules/profiles/types/profile-workflow';
import { AsyncBoundary } from '@/shared/components/operational/retry-ui';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';

const ProfileOnboardingContext = createContext<ProfileReadinessSnapshot | null>(null);

export function useProfileOnboardingSnapshot(): ProfileReadinessSnapshot | null {
  return useContext(ProfileOnboardingContext);
}

type ProfileOnboardingShellProps = {
  profileType: 'crew' | 'company';
  companyProfileId?: string;
  title: string;
  description: string;
  children: ReactNode;
  readinessOptional?: boolean;
};

export function ProfileOnboardingShell({
  profileType,
  companyProfileId,
  title,
  description,
  children,
  readinessOptional = false,
}: ProfileOnboardingShellProps) {
  const readinessEnabled =
    profileType === 'crew' || Boolean(companyProfileId);

  const target =
    profileType === 'crew' ? 'crew' : { companyProfileId: companyProfileId ?? '' };

  const { snapshot, isLoading, error, isRetrying, refresh } = useProfileReadiness(
    readinessEnabled ? target : { companyProfileId: '' },
  );

  const showReadiness = readinessEnabled;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {snapshot ? <ReadinessIndicator snapshot={snapshot} compact /> : null}
      </div>

      {!showReadiness ? (
        <ProfileOnboardingContext.Provider value={null}>{children}</ProfileOnboardingContext.Provider>
      ) : (
        <AsyncBoundary
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
          isRetrying={isRetrying}
          loadingFallback={<FormSectionSkeleton rows={4} />}
        >
          {snapshot ? (
            <ProfileOnboardingContext.Provider value={snapshot}>
              <div className="space-y-6">
                <OnboardingProgressIndicator
                  snapshot={snapshot}
                  title={profileType === 'crew' ? 'Crew onboarding' : 'Company onboarding'}
                />
                <ProfileCompletionIndicator
                  title={profileType === 'crew' ? 'Crew readiness' : 'Company readiness'}
                  completion={snapshot.completion}
                />
                <MissingRequirementsList sections={snapshot.completion.sections} />
                {children}
              </div>
            </ProfileOnboardingContext.Provider>
          ) : readinessOptional ? (
            <ProfileOnboardingContext.Provider value={null}>{children}</ProfileOnboardingContext.Provider>
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
      )}
    </section>
  );
}
