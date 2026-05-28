'use client';

import { useCallback, useState } from 'react';
import { profileQueryKeys } from '@/modules/profiles/hooks/profile-query-keys';
import {
  addCrewExperience,
  addCrewSkill,
  createCompanyProfile,
  createMyCrewProfile,
  removeCrewExperience,
  removeCrewSkill,
  updateBusinessMembership,
  updateCompanyFinance,
  updateCompanyProfile,
  updateMyCrewProfile,
} from '@/modules/profiles/hooks/profile-client';
import type {
  CreateCompanyProfileInput,
  CreateCrewProfileInput,
  UpdateBusinessMembershipInput,
  UpdateCompanyFinanceInput,
  UpdateCompanyProfileInput,
  UpdateCrewProfileInput,
  UpsertCrewExperienceInput,
  UpsertCrewSkillInput,
} from '@/modules/profiles/schemas';
import { useOperationalRefresh } from '@/shared/hooks/use-operational-refresh';
import { ApiClientError } from '@/shared/api/client';

type SaveState = {
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
  lastSavedAt: Date | null;
};

function initialSaveState(): SaveState {
  return { isSaving: false, isDirty: false, error: null, lastSavedAt: null };
}

function toErrorMessage(cause: unknown): string {
  if (cause instanceof ApiClientError) return cause.message;
  if (cause instanceof Error) return cause.message;
  return 'Save failed. Please try again.';
}

export function useProfileMutations() {
  const { invalidate } = useOperationalRefresh();
  const [saveState, setSaveState] = useState<SaveState>(initialSaveState);

  const markDirty = useCallback(() => {
    setSaveState((current) => ({ ...current, isDirty: true, error: null }));
  }, []);

  const invalidateCrew = useCallback(() => {
    invalidate(profileQueryKeys.crew.me);
    invalidate(profileQueryKeys.crew.readiness);
  }, [invalidate]);

  const invalidateCompany = useCallback(
    (companyProfileId: string) => {
      invalidate(profileQueryKeys.company.detail(companyProfileId));
      invalidate(profileQueryKeys.company.readiness(companyProfileId));
      invalidate(profileQueryKeys.company.all);
    },
    [invalidate],
  );

  const invalidateMembership = useCallback(() => {
    invalidate(profileQueryKeys.membership.current);
  }, [invalidate]);

  const runSave = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setSaveState((current) => ({ ...current, isSaving: true, error: null }));
    try {
      const result = await operation();
      setSaveState({
        isSaving: false,
        isDirty: false,
        error: null,
        lastSavedAt: new Date(),
      });
      return result;
    } catch (cause) {
      setSaveState((current) => ({
        ...current,
        isSaving: false,
        error: toErrorMessage(cause),
      }));
      return null;
    }
  }, []);

  const saveCrewProfile = useCallback(
    async (input: UpdateCrewProfileInput) => {
      const result = await runSave(() => updateMyCrewProfile(input));
      if (result) invalidateCrew();
      return result;
    },
    [invalidateCrew, runSave],
  );

  const createCrewProfile = useCallback(
    async (input: CreateCrewProfileInput) => {
      const result = await runSave(() => createMyCrewProfile(input));
      if (result) invalidateCrew();
      return result;
    },
    [invalidateCrew, runSave],
  );

  const saveCompanyProfile = useCallback(
    async (companyProfileId: string, input: UpdateCompanyProfileInput) => {
      const result = await runSave(() => updateCompanyProfile(companyProfileId, input));
      if (result) invalidateCompany(companyProfileId);
      return result;
    },
    [invalidateCompany, runSave],
  );

  const createCompany = useCallback(
    async (input: CreateCompanyProfileInput) => {
      const result = await runSave(() => createCompanyProfile(input));
      if (result) invalidateCompany(result.id);
      return result;
    },
    [invalidateCompany, runSave],
  );

  const saveCompanyFinance = useCallback(
    async (companyProfileId: string, input: UpdateCompanyFinanceInput) => {
      const result = await runSave(() => updateCompanyFinance(companyProfileId, input));
      if (result) invalidateCompany(companyProfileId);
      return result;
    },
    [invalidateCompany, runSave],
  );

  const saveMembership = useCallback(
    async (input: UpdateBusinessMembershipInput) => {
      const result = await runSave(() => updateBusinessMembership(input));
      if (result) invalidateMembership();
      return result;
    },
    [invalidateMembership, runSave],
  );

  const addSkill = useCallback(
    async (input: UpsertCrewSkillInput) => {
      const result = await runSave(() => addCrewSkill(input));
      if (result) invalidateCrew();
      return result;
    },
    [invalidateCrew, runSave],
  );

  const deleteSkill = useCallback(
    async (skillId: string) => {
      const result = await runSave(async () => {
        await removeCrewSkill(skillId);
        return true;
      });
      if (result) invalidateCrew();
      return result;
    },
    [invalidateCrew, runSave],
  );

  const addExperience = useCallback(
    async (input: UpsertCrewExperienceInput) => {
      const result = await runSave(() => addCrewExperience(input));
      if (result) invalidateCrew();
      return result;
    },
    [invalidateCrew, runSave],
  );

  const deleteExperience = useCallback(
    async (experienceId: string) => {
      const result = await runSave(async () => {
        await removeCrewExperience(experienceId);
        return true;
      });
      if (result) invalidateCrew();
      return result;
    },
    [invalidateCrew, runSave],
  );

  const resetSaveState = useCallback(() => {
    setSaveState(initialSaveState());
  }, []);

  return {
    saveState,
    markDirty,
    resetSaveState,
    saveCrewProfile,
    createCrewProfile,
    saveCompanyProfile,
    createCompany,
    saveCompanyFinance,
    saveMembership,
    addSkill,
    deleteSkill,
    addExperience,
    deleteExperience,
  };
}
