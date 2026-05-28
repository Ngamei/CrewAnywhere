'use client';

import { useCallback, useMemo, useState } from 'react';
import { ProfileSaveFooter } from '@/modules/profiles/components/profile-save-footer';
import { ProfileSectionCard } from '@/modules/profiles/components/profile-section-card';
import { ProfileSectionNav } from '@/modules/profiles/components/profile-section-nav';
import { VerificationStatusBadge } from '@/modules/profiles/components/verification-status-badge';
import { useProfileOnboardingSnapshot } from '@/modules/profiles/components/profile-onboarding-shell';
import { useCompanyProfile } from '@/modules/profiles/hooks/use-company-profile';
import { useProfileMutations } from '@/modules/profiles/hooks/use-profile-mutations';
import {
  createCompanyProfileSchema,
  updateCompanyFinanceSchema,
  updateCompanyProfileSchema,
} from '@/modules/profiles/schemas';
import type { CompanyProfileDto } from '@/modules/profiles/types';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { Badge } from '@/shared/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type CompanyDraft = {
  companyName: string;
  legalName: string;
  registrationNumber: string;
  websiteUrl: string;
  description: string;
  countryCode: string;
  billingEmail: string;
  taxIdentifier: string;
  taxCountryCode: string;
  defaultCurrency: string;
  paymentSetupCompleted: boolean;
  taxSetupCompleted: boolean;
};

const COMPANY_SECTIONS = [
  { key: 'basic_info', label: 'Company' },
  { key: 'legal_info', label: 'Legal' },
  { key: 'finance_setup', label: 'Finance' },
  { key: 'verification', label: 'KYB' },
] as const;

function profileToDraft(profile: CompanyProfileDto): CompanyDraft {
  return {
    companyName: profile.company_name ?? '',
    legalName: profile.legal_name ?? '',
    registrationNumber: profile.registration_number ?? '',
    websiteUrl: profile.website_url ?? '',
    description: profile.description ?? '',
    countryCode: profile.country_code ?? '',
    billingEmail: profile.finance?.billing_email ?? '',
    taxIdentifier: profile.finance?.tax_identifier ?? '',
    taxCountryCode: profile.finance?.tax_country_code ?? '',
    defaultCurrency: profile.finance?.default_currency ?? 'USD',
    paymentSetupCompleted: profile.finance?.payment_setup_completed ?? false,
    taxSetupCompleted: profile.finance?.tax_setup_completed ?? false,
  };
}

function stripUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

type CompanyProfileOperationalFormProps = {
  companyProfileId: string;
  onSaved?: () => void;
};

export function CompanyProfileOperationalForm({
  companyProfileId,
  onSaved,
}: CompanyProfileOperationalFormProps) {
  const { data: profile, isLoading, error, reload } = useCompanyProfile(companyProfileId);

  if (isLoading) {
    return <FormSectionSkeleton rows={8} />;
  }

  if (error) {
    return (
      <OperationalEmptyState
        variant="profile"
        title="Unable to load company profile"
        description={error.message}
        actionLabel="Retry"
        onAction={reload}
      />
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <CompanyProfileEditor
      key={`${profile.id}:${profile.updated_at}`}
      profile={profile}
      companyProfileId={companyProfileId}
      onSaved={() => {
        onSaved?.();
        reload();
      }}
    />
  );
}

function CompanyProfileEditor({
  profile,
  companyProfileId,
  onSaved,
}: {
  profile: CompanyProfileDto;
  companyProfileId: string;
  onSaved: () => void;
}) {
  const snapshot = useProfileOnboardingSnapshot();
  const completion = snapshot?.completion;
  const mutations = useProfileMutations();
  const [draft, setDraft] = useState(() => profileToDraft(profile));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string>('basic_info');

  const sectionNavItems = useMemo(() => {
    const sections = completion?.sections ?? [];
    return COMPANY_SECTIONS.map((section) => {
      const match = sections.find((item) => item.key === section.key);
      return {
        ...section,
        complete: match?.complete,
        required: match?.required,
      };
    });
  }, [completion?.sections]);

  const updateDraft = useCallback(
    (patch: Partial<CompanyDraft>) => {
      setDraft((current) => ({ ...current, ...patch }));
      mutations.markDirty();
      setFieldErrors({});
    },
    [mutations],
  );

  const scrollToSection = useCallback((key: string) => {
    setActiveSection(key);
    document.getElementById(`company-section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSave = useCallback(async () => {
    const profilePayload = stripUndefined({
      companyName: draft.companyName.trim() || undefined,
      legalName: draft.legalName.trim() || undefined,
      registrationNumber: draft.registrationNumber.trim() || undefined,
      websiteUrl: draft.websiteUrl.trim() || undefined,
      description: draft.description.trim() || undefined,
      countryCode: draft.countryCode.trim().toUpperCase() || undefined,
    });

    const financePayload = stripUndefined({
      billingEmail: draft.billingEmail.trim() || undefined,
      taxIdentifier: draft.taxIdentifier.trim() || undefined,
      taxCountryCode: draft.taxCountryCode.trim().toUpperCase() || undefined,
      defaultCurrency: draft.defaultCurrency.trim().toUpperCase() || undefined,
      paymentSetupCompleted: draft.paymentSetupCompleted,
      taxSetupCompleted: draft.taxSetupCompleted,
    });

    let saved = false;

    if (Object.keys(profilePayload).length > 0) {
      const parsedProfile = updateCompanyProfileSchema.safeParse(profilePayload);
      if (!parsedProfile.success) {
        const nextErrors: Record<string, string> = {};
        for (const issue of parsedProfile.error.issues) {
          const path = issue.path[0];
          if (typeof path === 'string') nextErrors[path] = issue.message;
        }
        setFieldErrors(nextErrors);
        return;
      }
      const profileResult = await mutations.saveCompanyProfile(companyProfileId, parsedProfile.data);
      saved = saved || Boolean(profileResult);
    }

    if (Object.keys(financePayload).length > 0) {
      const parsedFinance = updateCompanyFinanceSchema.safeParse(financePayload);
      if (!parsedFinance.success) {
        const nextErrors: Record<string, string> = {};
        for (const issue of parsedFinance.error.issues) {
          const path = issue.path[0];
          if (typeof path === 'string') nextErrors[path] = issue.message;
        }
        setFieldErrors(nextErrors);
        return;
      }
      const financeResult = await mutations.saveCompanyFinance(companyProfileId, parsedFinance.data);
      saved = saved || Boolean(financeResult);
    }

    if (saved) {
      onSaved();
    }
  }, [companyProfileId, draft, mutations, onSaved]);

  return (
    <div className="space-y-6">
      <ProfileSectionNav
        sections={sectionNavItems}
        activeKey={activeSection}
        onSelect={scrollToSection}
      />

      <ProfileSectionCard
        id="company-section-basic_info"
        title="Company basics"
        description="Trading identity shown to crew on jobs and events."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="company-name">
            <FormItem className="sm:col-span-2">
              <FormLabel>Company name</FormLabel>
              <FormControl>
                <Input
                  value={draft.companyName}
                  onChange={(event) => updateDraft({ companyName: event.target.value })}
                />
              </FormControl>
              {fieldErrors.companyName ? <FormMessage>{fieldErrors.companyName}</FormMessage> : null}
            </FormItem>
          </FormField>
          <FormField id="website-url">
            <FormItem className="sm:col-span-2">
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input
                  value={draft.websiteUrl}
                  onChange={(event) => updateDraft({ websiteUrl: event.target.value })}
                  type="url"
                  placeholder="https://…"
                />
              </FormControl>
            </FormItem>
          </FormField>
          <FormField id="description">
            <FormItem className="sm:col-span-2">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  value={draft.description}
                  onChange={(event) => updateDraft({ description: event.target.value })}
                  rows={4}
                />
              </FormControl>
            </FormItem>
          </FormField>
          <FormField id="country-code">
            <FormItem>
              <FormLabel>Country code</FormLabel>
              <FormControl>
                <Input
                  value={draft.countryCode}
                  onChange={(event) => updateDraft({ countryCode: event.target.value.toUpperCase() })}
                  maxLength={2}
                />
              </FormControl>
            </FormItem>
          </FormField>
          <div className="flex items-end">
            <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
              Status: {profile.status}
            </Badge>
          </div>
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        id="company-section-legal_info"
        title="Legal identity & staffing"
        description="Registration details used for KYB and compliance."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="legal-name">
            <FormItem>
              <FormLabel>Legal name</FormLabel>
              <FormControl>
                <Input
                  value={draft.legalName}
                  onChange={(event) => updateDraft({ legalName: event.target.value })}
                />
              </FormControl>
            </FormItem>
          </FormField>
          <FormField id="registration-number">
            <FormItem>
              <FormLabel>Registration number</FormLabel>
              <FormControl>
                <Input
                  value={draft.registrationNumber}
                  onChange={(event) => updateDraft({ registrationNumber: event.target.value })}
                />
              </FormControl>
            </FormItem>
          </FormField>
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        id="company-section-finance_setup"
        title="Billing & tax setup"
        description="Finance configuration required for operational readiness."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="billing-email">
            <FormItem className="sm:col-span-2">
              <FormLabel>Billing email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  value={draft.billingEmail}
                  onChange={(event) => updateDraft({ billingEmail: event.target.value })}
                />
              </FormControl>
              {fieldErrors.billingEmail ? <FormMessage>{fieldErrors.billingEmail}</FormMessage> : null}
            </FormItem>
          </FormField>
          <FormField id="tax-identifier">
            <FormItem>
              <FormLabel>Tax identifier</FormLabel>
              <FormControl>
                <Input
                  value={draft.taxIdentifier}
                  onChange={(event) => updateDraft({ taxIdentifier: event.target.value })}
                />
              </FormControl>
            </FormItem>
          </FormField>
          <FormField id="tax-country">
            <FormItem>
              <FormLabel>Tax country</FormLabel>
              <FormControl>
                <Input
                  value={draft.taxCountryCode}
                  onChange={(event) => updateDraft({ taxCountryCode: event.target.value.toUpperCase() })}
                  maxLength={2}
                />
              </FormControl>
            </FormItem>
          </FormField>
          <FormField id="default-currency">
            <FormItem>
              <FormLabel>Default currency</FormLabel>
              <FormControl>
                <Input
                  value={draft.defaultCurrency}
                  onChange={(event) => updateDraft({ defaultCurrency: event.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </FormControl>
            </FormItem>
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.paymentSetupCompleted}
                onChange={(event) => updateDraft({ paymentSetupCompleted: event.target.checked })}
                className="size-4 rounded border"
              />
              Payment setup completed
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.taxSetupCompleted}
                onChange={(event) => updateDraft({ taxSetupCompleted: event.target.checked })}
                className="size-4 rounded border"
              />
              Tax setup completed
            </label>
          </div>
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        id="company-section-verification"
        title="Business verification (KYB)"
        description="Verification status drives business-ready and operational flags."
      >
        <div className="flex flex-wrap items-center gap-3">
          <VerificationStatusBadge status={profile.kyb?.status ?? null} label="KYB" />
          <Badge variant={profile.business_ready ? 'default' : 'outline'}>
            Business {profile.business_ready ? 'ready' : 'not ready'}
          </Badge>
          <Badge variant={profile.verified_business ? 'default' : 'outline'}>
            {profile.verified_business ? 'Verified' : 'Unverified'}
          </Badge>
        </div>
        {profile.kyb?.rejected_reason ? (
          <p className="mt-3 text-sm text-destructive">{profile.kyb.rejected_reason}</p>
        ) : null}
      </ProfileSectionCard>

      <ProfileSaveFooter
        isSaving={mutations.saveState.isSaving}
        isDirty={mutations.saveState.isDirty}
        error={mutations.saveState.error}
        lastSavedAt={mutations.saveState.lastSavedAt}
        onSave={handleSave}
      />
    </div>
  );
}

type CreateCompanyProfileFormProps = {
  onCreated: (companyProfileId: string) => void;
};

export function CreateCompanyProfileForm({ onCreated }: CreateCompanyProfileFormProps) {
  const mutations = useProfileMutations();
  const [draft, setDraft] = useState({ companyName: '', countryCode: '', description: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleCreate = useCallback(async () => {
    const payload = {
      companyName: draft.companyName.trim(),
      countryCode: draft.countryCode.trim().toUpperCase() || undefined,
      description: draft.description.trim() || undefined,
    };
    const parsed = createCompanyProfileSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors({ companyName: parsed.error.issues[0]?.message ?? 'Invalid input' });
      return;
    }
    const result = await mutations.createCompany(parsed.data);
    if (result) onCreated(result.id);
  }, [draft, mutations, onCreated]);

  return (
    <ProfileSectionCard
      id="company-section-create"
      title="Create company profile"
      description="Set up your business profile to start onboarding."
    >
      <div className="space-y-4">
        <FormField id="create-company-name">
          <FormItem>
            <FormLabel>Company name</FormLabel>
            <FormControl>
              <Input
                value={draft.companyName}
                onChange={(event) => {
                  mutations.markDirty();
                  setDraft((current) => ({ ...current, companyName: event.target.value }));
                }}
              />
            </FormControl>
            {fieldErrors.companyName ? <FormMessage>{fieldErrors.companyName}</FormMessage> : null}
          </FormItem>
        </FormField>
        <FormField id="create-country">
          <FormItem>
            <FormLabel>Country code</FormLabel>
            <FormControl>
              <Input
                value={draft.countryCode}
                onChange={(event) => {
                  mutations.markDirty();
                  setDraft((current) => ({
                    ...current,
                    countryCode: event.target.value.toUpperCase(),
                  }));
                }}
                maxLength={2}
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
      <ProfileSaveFooter
        isSaving={mutations.saveState.isSaving}
        isDirty={mutations.saveState.isDirty}
        error={mutations.saveState.error}
        lastSavedAt={mutations.saveState.lastSavedAt}
        onSave={handleCreate}
        saveLabel="Create company"
      />
    </ProfileSectionCard>
  );
}
