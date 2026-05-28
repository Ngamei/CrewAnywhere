'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_ONBOARDING_PROGRESS,
  syncOnboardingCookies,
  writeOnboardingProgress,
} from '@/modules/onboarding/lib/onboarding-storage';
import type {
  AuthOnboardingStep,
  AuthOnboardingProgress,
  OnboardingAccountType,
} from '@/modules/onboarding/types';

type OnboardingStore = AuthOnboardingProgress & {
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setAccountType: (accountType: OnboardingAccountType) => void;
  setCurrentStep: (step: AuthOnboardingStep) => void;
  markComplete: () => void;
  reset: () => void;
  syncFromServerAccountType: (accountType: OnboardingAccountType) => void;
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_ONBOARDING_PROGRESS,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setAccountType: (accountType) => {
        const next = {
          ...get(),
          accountType,
          currentStep: 'account_type' as const,
        };
        writeOnboardingProgress(next);
        set(next);
      },
      setCurrentStep: (currentStep) => {
        const next = { ...get(), currentStep };
        writeOnboardingProgress(next);
        set({ currentStep });
      },
      markComplete: () => {
        const next = {
          ...get(),
          currentStep: 'complete' as const,
          isComplete: true,
          completedAt: new Date().toISOString(),
        };
        writeOnboardingProgress(next);
        set(next);
      },
      reset: () => {
        writeOnboardingProgress(DEFAULT_ONBOARDING_PROGRESS);
        set({ ...DEFAULT_ONBOARDING_PROGRESS });
      },
      syncFromServerAccountType: (accountType) => {
        const next = {
          ...get(),
          accountType,
          isComplete: true,
          currentStep: 'complete' as const,
          completedAt: get().completedAt ?? new Date().toISOString(),
        };
        writeOnboardingProgress(next);
        set(next);
      },
    }),
    {
      name: 'crewanywhere:auth-onboarding:v1',
      partialize: (state) => ({
        accountType: state.accountType,
        currentStep: state.currentStep,
        isComplete: state.isComplete,
        completedAt: state.completedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          syncOnboardingCookies(state);
          state.setHydrated(true);
        }
      },
    },
  ),
);
