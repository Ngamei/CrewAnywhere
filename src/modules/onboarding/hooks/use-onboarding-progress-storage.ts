'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  ONBOARDING_STORAGE_KEY,
  type OnboardingProgressState,
  type OperationalMilestoneId,
} from '@/modules/onboarding/types/operational-onboarding';

const DEFAULT_STATE: OnboardingProgressState = {
  dismissedBannerIds: [],
  acknowledgedMilestones: {},
};

const listeners = new Set<() => void>();

function emitStorageChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', listener);
    }
  };
}

function readStorage(): OnboardingProgressState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingProgressState>;
    return {
      dismissedBannerIds: parsed.dismissedBannerIds ?? [],
      acknowledgedMilestones: parsed.acknowledgedMilestones ?? {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeStorage(state: OnboardingProgressState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  emitStorageChange();
}

export function useOnboardingProgressStorage() {
  const state = useSyncExternalStore(subscribe, readStorage, () => DEFAULT_STATE);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => typeof window !== 'undefined',
    () => false,
  );

  const dismissBanner = useCallback((bannerId: string) => {
    const prev = readStorage();
    writeStorage({
      ...prev,
      dismissedBannerIds: prev.dismissedBannerIds.includes(bannerId)
        ? prev.dismissedBannerIds
        : [...prev.dismissedBannerIds, bannerId],
    });
  }, []);

  const acknowledgeMilestone = useCallback((milestoneId: OperationalMilestoneId) => {
    const prev = readStorage();
    writeStorage({
      ...prev,
      acknowledgedMilestones: {
        ...prev.acknowledgedMilestones,
        [milestoneId]: new Date().toISOString(),
      },
    });
  }, []);

  const isBannerDismissed = useCallback(
    (bannerId: string) => state.dismissedBannerIds.includes(bannerId),
    [state.dismissedBannerIds],
  );

  const isMilestoneAcknowledged = useCallback(
    (milestoneId: OperationalMilestoneId) => Boolean(state.acknowledgedMilestones[milestoneId]),
    [state.acknowledgedMilestones],
  );

  return {
    hydrated,
    dismissBanner,
    acknowledgeMilestone,
    isBannerDismissed,
    isMilestoneAcknowledged,
  };
}
