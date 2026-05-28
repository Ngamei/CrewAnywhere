import {
  isIdentityPendingSession,
  isPlatformSessionPayload,
  type AuthSessionResponse,
} from '@/shared/auth/types';
import { AUTH_ROUTES, ONBOARDING_ROUTES, resolveDashboardEntry } from '@/modules/onboarding/lib/routes';
import type { AuthOnboardingProgress, OnboardingAccountType } from '@/modules/onboarding/types';

type ResolveRedirectTargetInput = {
  session: AuthSessionResponse | undefined;
  onboarding: AuthOnboardingProgress;
  nextParam?: string | null;
};

/**
 * Central redirect policy for auth and onboarding surfaces.
 * Prefers platform identity, then persisted onboarding progress, then safe defaults.
 */
export function resolveAuthRedirectTarget({
  session,
  onboarding,
  nextParam,
}: ResolveRedirectTargetInput): string {
  if (!session?.authenticated) {
    return AUTH_ROUTES.login;
  }

  if (isPlatformSessionPayload(session)) {
    if (nextParam && nextParam.startsWith('/dashboard')) {
      return nextParam;
    }

    const accountType = session.identity.accountType;
    const entryType: OnboardingAccountType | null =
      accountType === 'crew' || accountType === 'business' ? accountType : null;
    return resolveDashboardEntry(entryType);
  }

  if (isIdentityPendingSession(session)) {
    if (onboarding.isComplete) {
      return resolveDashboardEntry(onboarding.accountType);
    }

    if (!onboarding.accountType) {
      return ONBOARDING_ROUTES.accountType;
    }

    if (onboarding.currentStep === 'complete') {
      return ONBOARDING_ROUTES.complete;
    }

    return ONBOARDING_ROUTES.start;
  }

  return ONBOARDING_ROUTES.start;
}

export function shouldBlockAuthPage(session: AuthSessionResponse | undefined) {
  return Boolean(session?.authenticated);
}

export function shouldRequireOnboarding(
  session: AuthSessionResponse | undefined,
  onboarding: AuthOnboardingProgress,
) {
  if (!session?.authenticated) {
    return false;
  }

  if (isPlatformSessionPayload(session)) {
    return false;
  }

  return !onboarding.isComplete;
}
