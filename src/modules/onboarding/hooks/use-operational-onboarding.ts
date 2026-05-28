'use client';

import { useMemo } from 'react';
import { filterStepsForActor } from '@/modules/onboarding/lib/onboarding-steps';
import { useOnboardingProgressStorage } from '@/modules/onboarding/hooks/use-onboarding-progress-storage';
import { useOwnedCompanyProfiles } from '@/modules/profiles/hooks/use-owned-company-profiles';
import type {
  OnboardingStep,
  OnboardingStepStatus,
  OperationalMilestoneId,
} from '@/modules/onboarding/types/operational-onboarding';
import { useProfileReadiness } from '@/modules/profiles/hooks/use-profile-readiness';
import type { ProfileReadinessSnapshot } from '@/modules/profiles/types/profile-workflow';
import { isPlatformSessionPayload } from '@/shared/auth/types';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';

function resolveProfileHref(accountType: string): string {
  if (accountType === 'crew') return '/dashboard/profile/crew';
  if (accountType === 'business') return '/dashboard/profile/company';
  return '/dashboard/profile';
}

function isMilestoneComplete(
  id: OperationalMilestoneId,
  input: {
    snapshot: ProfileReadinessSnapshot | null;
    acknowledged: (id: OperationalMilestoneId) => boolean;
    accountType: string;
  },
): boolean {
  const { snapshot, acknowledged, accountType } = input;

  if (acknowledged(id)) return true;

  if (!snapshot) {
    return false;
  }

  switch (id) {
    case 'profile_complete':
      return snapshot.completion.onboardingComplete;
    case 'operational_active':
      return snapshot.completion.operationalReady;
    case 'wallet_setup':
      return accountType === 'crew' && snapshot.completion.operationalReady;
    case 'marketplace_apply':
      return accountType === 'crew' && snapshot.marketplaceReady;
    default:
      return false;
  }
}

function toStepStatus(
  complete: boolean,
  isCurrent: boolean,
): OnboardingStepStatus {
  if (complete) return 'complete';
  if (isCurrent) return 'current';
  return 'upcoming';
}

export function useOperationalOnboarding() {
  const sessionQuery = usePlatformSession();
  const storage = useOnboardingProgressStorage();
  const session = sessionQuery.data;
  const identity = session && isPlatformSessionPayload(session) ? session.identity : null;
  const accountType = identity?.accountType ?? 'crew';
  const role = identity?.role ?? 'crew';
  const isBusiness = accountType === 'business';

  const ownedCompanies = useOwnedCompanyProfiles({
    enabled: isBusiness && !sessionQuery.isLoading,
  });
  const primaryCompanyProfileId = ownedCompanies.data?.[0]?.id ?? null;

  const crewReadiness = useProfileReadiness('crew');
  const companyReadiness = useProfileReadiness(
    primaryCompanyProfileId ? { companyProfileId: primaryCompanyProfileId } : { companyProfileId: '' },
  );

  const readinessQuery =
    accountType === 'crew' ? crewReadiness : companyReadiness;

  const snapshot = readinessQuery.snapshot;
  const profileHref = resolveProfileHref(accountType);

  const steps = useMemo((): OnboardingStep[] => {
    const definitions = filterStepsForActor({ accountType, role });
    const firstIncompleteIndex = definitions.findIndex(
      (def) =>
        !isMilestoneComplete(def.id, {
          snapshot,
          acknowledged: storage.isMilestoneAcknowledged,
          accountType,
        }),
    );

    return definitions.map((def, index) => {
      const complete = isMilestoneComplete(def.id, {
        snapshot,
        acknowledged: storage.isMilestoneAcknowledged,
        accountType,
      });
      const isCurrent = !complete && index === firstIncompleteIndex;
      const href = def.id === 'profile_complete' || def.id === 'operational_active'
        ? profileHref
        : def.href;

      return {
        id: def.id,
        title: def.title,
        description: def.description,
        href,
        ctaLabel: def.ctaLabel,
        complete,
        status: toStepStatus(complete, isCurrent),
      };
    });
  }, [accountType, role, snapshot, storage.isMilestoneAcknowledged, profileHref]);

  const completedCount = steps.filter((s) => s.complete).length;
  const overallPercent =
    steps.length === 0 ? 100 : Math.round((completedCount / steps.length) * 100);

  const nextStep = steps.find((s) => !s.complete) ?? null;
  const isOnboardingComplete = steps.length > 0 && completedCount === steps.length;

  const showDashboardBanner =
    storage.hydrated &&
    !storage.isBannerDismissed('dashboard-operational-banner') &&
    !isOnboardingComplete;

  return {
    accountType,
    role,
    identity,
    snapshot,
    steps,
    nextStep,
    overallPercent,
    isOnboardingComplete,
    showDashboardBanner,
    isSessionLoading: sessionQuery.isLoading || !storage.hydrated,
    isReadinessLoading:
      accountType === 'business'
        ? ownedCompanies.isLoading || readinessQuery.isLoading
        : readinessQuery.isLoading,
    readinessError: readinessQuery.error,
    refreshReadiness: readinessQuery.refresh,
    dismissDashboardBanner: () => storage.dismissBanner('dashboard-operational-banner'),
    acknowledgeMilestone: storage.acknowledgeMilestone,
    primaryCompanyProfileId,
  };
}
