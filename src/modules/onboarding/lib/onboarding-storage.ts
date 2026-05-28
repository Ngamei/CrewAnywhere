import { ONBOARDING_COMPLETE_COOKIE } from '@/middleware/config';
import type { AuthOnboardingProgress, OnboardingAccountType } from '@/modules/onboarding/types';

const STORAGE_KEY = 'crewanywhere:auth-onboarding:v1';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const DEFAULT_ONBOARDING_PROGRESS: AuthOnboardingProgress = {
  accountType: null,
  currentStep: 'welcome',
  isComplete: false,
  completedAt: null,
};

export function readOnboardingProgress(): AuthOnboardingProgress {
  if (typeof window === 'undefined') {
    return DEFAULT_ONBOARDING_PROGRESS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ONBOARDING_PROGRESS;
    }

    const parsed = JSON.parse(raw) as Partial<AuthOnboardingProgress>;
    return {
      ...DEFAULT_ONBOARDING_PROGRESS,
      ...parsed,
    };
  } catch {
    return DEFAULT_ONBOARDING_PROGRESS;
  }
}

export function writeOnboardingProgress(progress: AuthOnboardingProgress) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  syncOnboardingCookies(progress);
}

export function syncOnboardingCookies(progress: AuthOnboardingProgress) {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const completeValue = progress.isComplete ? 'true' : 'false';

  document.cookie = `${ONBOARDING_COMPLETE_COOKIE}=${completeValue}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;

  if (progress.accountType) {
    document.cookie = `ca_onboarding_account_type=${progress.accountType}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  }
}

export function clearOnboardingProgress() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  if (typeof document !== 'undefined') {
    document.cookie = `${ONBOARDING_COMPLETE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = 'ca_onboarding_account_type=; Path=/; Max-Age=0; SameSite=Lax';
  }
}

export function markOnboardingComplete(accountType?: OnboardingAccountType | null) {
  const current = readOnboardingProgress();
  const next: AuthOnboardingProgress = {
    ...current,
    accountType: accountType ?? current.accountType,
    currentStep: 'complete',
    isComplete: true,
    completedAt: new Date().toISOString(),
  };

  writeOnboardingProgress(next);
  return next;
}

export function setOnboardingAccountType(accountType: OnboardingAccountType) {
  const current = readOnboardingProgress();
  const next: AuthOnboardingProgress = {
    ...current,
    accountType,
    currentStep: 'account_type',
  };

  writeOnboardingProgress(next);
  return next;
}
