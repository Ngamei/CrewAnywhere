'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  BusinessMembershipCard,
  CompanyProfileOperationalForm,
  CreateCompanyProfileForm,
  ProfileOnboardingShell,
} from '@/modules/profiles/components';
import { useOwnedCompanyProfiles } from '@/modules/profiles/hooks/use-owned-company-profiles';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { cn } from '@/shared/lib/cn';

export function CompanyProfileScreen() {
  const { data: companies, isLoading, error, reload } = useOwnedCompanyProfiles();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeCompanyId = useMemo(() => {
    if (selectedId) return selectedId;
    return companies?.[0]?.id ?? null;
  }, [companies, selectedId]);

  const handleCreated = useCallback(
    (companyProfileId: string) => {
      setSelectedId(companyProfileId);
      reload();
    },
    [reload],
  );

  if (isLoading) {
    return <FormSectionSkeleton rows={6} />;
  }

  if (error) {
    return (
      <OperationalEmptyState
        variant="profile"
        title="Unable to load company profiles"
        description={error.message}
        actionLabel="Retry"
        onAction={reload}
      />
    );
  }

  if (!activeCompanyId) {
    return (
      <ProfileOnboardingShell
        profileType="company"
        title="Company profile"
        description="Complete business onboarding to publish jobs and manage crew operations."
        readinessOptional
      >
        <CreateCompanyProfileForm onCreated={handleCreated} />
        <BusinessMembershipCard />
      </ProfileOnboardingShell>
    );
  }

  return (
    <CompanyProfileScreenWithId
      companyProfileId={activeCompanyId}
      companies={companies ?? []}
      onSelectCompany={setSelectedId}
    />
  );
}

type CompanyProfileScreenWithIdProps = {
  companyProfileId: string;
  companies: Array<{ id: string; company_name: string }>;
  onSelectCompany: (id: string) => void;
};

function CompanyProfileScreenWithId({
  companyProfileId,
  companies,
  onSelectCompany,
}: CompanyProfileScreenWithIdProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ProfileOnboardingShell
      key={`${companyProfileId}-${refreshKey}`}
      profileType="company"
      companyProfileId={companyProfileId}
      title="Company profile"
      description="Complete business onboarding to publish jobs and manage crew operations."
    >
      {companies.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => onSelectCompany(company.id)}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors',
                company.id === companyProfileId
                  ? 'border-primary bg-primary/10 font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              {company.company_name}
            </button>
          ))}
        </div>
      ) : null}
      <CompanyProfileOperationalForm
        companyProfileId={companyProfileId}
        onSaved={() => setRefreshKey((value) => value + 1)}
      />
      <BusinessMembershipCard />
    </ProfileOnboardingShell>
  );
}
