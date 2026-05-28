'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ProfilePhotoPlaceholder } from '@/modules/profiles/components/profile-photo-placeholder';
import { ProfileSaveFooter } from '@/modules/profiles/components/profile-save-footer';
import { ProfileSectionCard } from '@/modules/profiles/components/profile-section-card';
import { ProfileSectionNav } from '@/modules/profiles/components/profile-section-nav';
import { VerificationStatusBadge } from '@/modules/profiles/components/verification-status-badge';
import { useProfileOnboardingSnapshot } from '@/modules/profiles/components/profile-onboarding-shell';
import { useCrewProfile } from '@/modules/profiles/hooks/use-crew-profile';
import { useProfileMutations } from '@/modules/profiles/hooks/use-profile-mutations';
import {
  createCrewProfileSchema,
  updateCrewProfileSchema,
  upsertCrewExperienceSchema,
  upsertCrewSkillSchema,
} from '@/modules/profiles/schemas';
import type { CrewProfileDto } from '@/modules/profiles/types';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type CrewDraft = {
  displayName: string;
  introduction: string;
  profileImageUrl: string;
  city: string;
  countryCode: string;
  hourlyRateAmount: string;
  hourlyRateCurrency: string;
};

const CREW_SECTIONS = [
  { key: 'basic_info', label: 'Basics' },
  { key: 'location', label: 'Location' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'rates', label: 'Rates' },
  { key: 'verification', label: 'KYC' },
  { key: 'publish', label: 'Marketplace' },
] as const;

function emptyDraft(): CrewDraft {
  return {
    displayName: '',
    introduction: '',
    profileImageUrl: '',
    city: '',
    countryCode: '',
    hourlyRateAmount: '',
    hourlyRateCurrency: 'USD',
  };
}

function profileToDraft(profile: CrewProfileDto): CrewDraft {
  return {
    displayName: profile.display_name ?? '',
    introduction: profile.introduction ?? '',
    profileImageUrl: profile.profile_image_url ?? '',
    city: profile.city ?? '',
    countryCode: profile.country_code ?? '',
    hourlyRateAmount:
      profile.hourly_rate_amount != null ? String(profile.hourly_rate_amount) : '',
    hourlyRateCurrency: profile.hourly_rate_currency ?? 'USD',
  };
}

type CrewProfileOperationalFormProps = {
  onSaved?: () => void;
};

export function CrewProfileOperationalForm({ onSaved }: CrewProfileOperationalFormProps) {
  const { data: profile, isLoading, error, reload } = useCrewProfile();
  const isNotFound = error?.message.toLowerCase().includes('not found');

  if (isLoading) {
    return <FormSectionSkeleton rows={8} />;
  }

  if (error && !isNotFound) {
    return (
      <OperationalEmptyState
        variant="profile"
        title="Unable to load crew profile"
        description={error.message}
        actionLabel="Retry"
        onAction={reload}
      />
    );
  }

  if (!profile && isNotFound) {
    return <CrewProfileCreateForm onCreated={() => { onSaved?.(); reload(); }} />;
  }

  if (!profile) {
    return null;
  }

  return (
    <CrewProfileEditor
      key={`${profile.id}:${profile.updated_at}`}
      profile={profile}
      onSaved={() => {
        onSaved?.();
        reload();
      }}
    />
  );
}

function CrewProfileCreateForm({ onCreated }: { onCreated: () => void }) {
  const mutations = useProfileMutations();
  const [draft, setDraft] = useState<CrewDraft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateDraft = (patch: Partial<CrewDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    mutations.markDirty();
    setFieldErrors({});
  };

  const handleCreate = async () => {
    const payload = {
      displayName: draft.displayName.trim(),
      introduction: draft.introduction.trim() || undefined,
    };
    const parsed = createCrewProfileSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors({ displayName: parsed.error.issues[0]?.message ?? 'Invalid input' });
      return;
    }
    const result = await mutations.createCrewProfile(parsed.data);
    if (result) onCreated();
  };

  return (
    <ProfileSectionCard
      id="crew-section-create"
      title="Create your crew profile"
      description="Start with the basics — you can add skills and experience after saving."
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ProfilePhotoPlaceholder displayName={draft.displayName} size="lg" />
        <div className="flex-1 space-y-4">
          <FormField id="create-display-name">
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input
                  value={draft.displayName}
                  onChange={(event) => updateDraft({ displayName: event.target.value })}
                  placeholder="Alex Rivera"
                  autoComplete="name"
                />
              </FormControl>
              {fieldErrors.displayName ? <FormMessage>{fieldErrors.displayName}</FormMessage> : null}
            </FormItem>
          </FormField>
          <FormField id="create-introduction">
            <FormItem>
              <FormLabel>Introduction</FormLabel>
              <FormControl>
                <Textarea
                  value={draft.introduction}
                  onChange={(event) => updateDraft({ introduction: event.target.value })}
                  placeholder="Tell businesses about your experience…"
                  rows={4}
                />
              </FormControl>
            </FormItem>
          </FormField>
        </div>
      </div>
      <ProfileSaveFooter
        isSaving={mutations.saveState.isSaving}
        isDirty={mutations.saveState.isDirty}
        error={mutations.saveState.error}
        lastSavedAt={mutations.saveState.lastSavedAt}
        onSave={handleCreate}
        saveLabel="Create profile"
      />
    </ProfileSectionCard>
  );
}

function CrewProfileEditor({
  profile,
  onSaved,
}: {
  profile: CrewProfileDto;
  onSaved: () => void;
}) {
  const snapshot = useProfileOnboardingSnapshot();
  const completion = snapshot?.completion;
  const mutations = useProfileMutations();
  const [draft, setDraft] = useState(() => profileToDraft(profile));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string>('basic_info');
  const [newSkill, setNewSkill] = useState({ skillName: '', skillCategory: '' });
  const [newExperience, setNewExperience] = useState({
    roleTitle: '',
    companyName: '',
    description: '',
    startsOn: '',
    endsOn: '',
  });

  const sectionNavItems = useMemo(() => {
    const sections = completion?.sections ?? [];
    return CREW_SECTIONS.map((section) => {
      const match = sections.find((item) => item.key === section.key);
      return {
        ...section,
        complete: match?.complete,
        required: match?.required,
      };
    });
  }, [completion?.sections]);

  const updateDraft = useCallback(
    (patch: Partial<CrewDraft>) => {
      setDraft((current) => ({ ...current, ...patch }));
      mutations.markDirty();
      setFieldErrors({});
    },
    [mutations],
  );

  const scrollToSection = useCallback((key: string) => {
    setActiveSection(key);
    document.getElementById(`crew-section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const buildUpdatePayload = useCallback(() => {
    const hourlyRate = draft.hourlyRateAmount.trim()
      ? Number.parseFloat(draft.hourlyRateAmount)
      : undefined;

    return Object.fromEntries(
      Object.entries({
        displayName: draft.displayName.trim() || undefined,
        introduction: draft.introduction.trim() || undefined,
        profileImageUrl: draft.profileImageUrl.trim() || undefined,
        city: draft.city.trim() || undefined,
        countryCode: draft.countryCode.trim().toUpperCase() || undefined,
        hourlyRateAmount: hourlyRate,
        hourlyRateCurrency: draft.hourlyRateCurrency.trim().toUpperCase() || undefined,
      }).filter(([, value]) => value !== undefined),
    );
  }, [draft]);

  const handleSaveProfile = useCallback(async () => {
    const payload = buildUpdatePayload();
    const parsed = updateCrewProfileSchema.safeParse(payload);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === 'string') nextErrors[path] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    const result = await mutations.saveCrewProfile(parsed.data);
    if (result) onSaved();
  }, [buildUpdatePayload, mutations, onSaved]);

  const handleAddSkill = useCallback(async () => {
    const parsed = upsertCrewSkillSchema.safeParse({
      skillName: newSkill.skillName,
      skillCategory: newSkill.skillCategory || undefined,
    });
    if (!parsed.success) {
      setFieldErrors({ skillName: parsed.error.issues[0]?.message ?? 'Invalid skill' });
      return;
    }
    const result = await mutations.addSkill(parsed.data);
    if (result) {
      setNewSkill({ skillName: '', skillCategory: '' });
      onSaved();
    }
  }, [mutations, newSkill, onSaved]);

  const handleAddExperience = useCallback(async () => {
    const parsed = upsertCrewExperienceSchema.safeParse({
      roleTitle: newExperience.roleTitle,
      companyName: newExperience.companyName || undefined,
      description: newExperience.description || undefined,
      startsOn: newExperience.startsOn || undefined,
      endsOn: newExperience.endsOn || undefined,
    });
    if (!parsed.success) {
      setFieldErrors({ roleTitle: parsed.error.issues[0]?.message ?? 'Invalid experience' });
      return;
    }
    const result = await mutations.addExperience(parsed.data);
    if (result) {
      setNewExperience({ roleTitle: '', companyName: '', description: '', startsOn: '', endsOn: '' });
      onSaved();
    }
  }, [mutations, newExperience, onSaved]);

  return (
    <div className="space-y-6">
      <ProfileSectionNav
        sections={sectionNavItems}
        activeKey={activeSection}
        onSelect={scrollToSection}
      />

      <ProfileSectionCard
        id="crew-section-basic_info"
        title="Profile basics"
        description="How you appear to businesses on the marketplace."
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <ProfilePhotoPlaceholder
            imageUrl={draft.profileImageUrl || profile.profile_image_url}
            displayName={draft.displayName}
            size="lg"
          />
          <div className="flex-1 space-y-4">
            <FormField id="display-name">
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input
                    value={draft.displayName}
                    onChange={(event) => updateDraft({ displayName: event.target.value })}
                    autoComplete="name"
                  />
                </FormControl>
                {fieldErrors.displayName ? <FormMessage>{fieldErrors.displayName}</FormMessage> : null}
              </FormItem>
            </FormField>
            <FormField id="profile-image-url">
              <FormItem>
                <FormLabel>Profile photo URL</FormLabel>
                <FormControl>
                  <Input
                    value={draft.profileImageUrl}
                    onChange={(event) => updateDraft({ profileImageUrl: event.target.value })}
                    placeholder="https://…"
                    type="url"
                  />
                </FormControl>
                <FormDescription>Image upload integration coming soon — paste a URL for now.</FormDescription>
              </FormItem>
            </FormField>
            <FormField id="introduction">
              <FormItem>
                <FormLabel>Introduction</FormLabel>
                <FormControl>
                  <Textarea
                    value={draft.introduction}
                    onChange={(event) => updateDraft({ introduction: event.target.value })}
                    rows={4}
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        id="crew-section-location"
        title="Location"
        description="Where you are based for shift matching."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="city">
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input
                  value={draft.city}
                  onChange={(event) => updateDraft({ city: event.target.value })}
                  autoComplete="address-level2"
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
                  placeholder="GB"
                  autoComplete="country"
                />
              </FormControl>
              {fieldErrors.countryCode ? <FormMessage>{fieldErrors.countryCode}</FormMessage> : null}
            </FormItem>
          </FormField>
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        id="crew-section-skills"
        title="Skills"
        description="Add skills that match the roles you want."
      >
        <ul className="space-y-2">
          {profile.skills.length === 0 ? (
            <li className="text-sm text-muted-foreground">No skills added yet.</li>
          ) : (
            profile.skills.map((skill) => (
              <li
                key={skill.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{skill.skill_name}</span>
                  {skill.skill_category ? (
                    <span className="ml-2 text-muted-foreground">· {skill.skill_category}</span>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${skill.skill_name}`}
                  onClick={async () => {
                    await mutations.deleteSkill(skill.id);
                    onSaved();
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            value={newSkill.skillName}
            onChange={(event) => setNewSkill((current) => ({ ...current, skillName: event.target.value }))}
            placeholder="Skill name"
          />
          <Input
            value={newSkill.skillCategory}
            onChange={(event) => setNewSkill((current) => ({ ...current, skillCategory: event.target.value }))}
            placeholder="Category (optional)"
          />
          <Button type="button" variant="outline" onClick={handleAddSkill} disabled={mutations.saveState.isSaving}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        {fieldErrors.skillName ? <FormMessage>{fieldErrors.skillName}</FormMessage> : null}
      </ProfileSectionCard>

      <ProfileSectionCard
        id="crew-section-experience"
        title="Experience"
        description="Optional work history to strengthen your profile."
      >
        <ul className="space-y-2">
          {profile.experience.length === 0 ? (
            <li className="text-sm text-muted-foreground">No experience entries yet.</li>
          ) : (
            profile.experience.map((entry) => (
              <li key={entry.id} className="rounded-md border px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{entry.role_title}</p>
                    {entry.company_name ? (
                      <p className="text-muted-foreground">{entry.company_name}</p>
                    ) : null}
                    {entry.starts_on || entry.ends_on ? (
                      <p className="text-xs text-muted-foreground">
                        {entry.starts_on ?? '—'} → {entry.ends_on ?? 'Present'}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${entry.role_title}`}
                    onClick={async () => {
                      await mutations.deleteExperience(entry.id);
                      onSaved();
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            value={newExperience.roleTitle}
            onChange={(event) =>
              setNewExperience((current) => ({ ...current, roleTitle: event.target.value }))
            }
            placeholder="Role title"
          />
          <Input
            value={newExperience.companyName}
            onChange={(event) =>
              setNewExperience((current) => ({ ...current, companyName: event.target.value }))
            }
            placeholder="Company (optional)"
          />
          <Input
            type="date"
            value={newExperience.startsOn}
            onChange={(event) =>
              setNewExperience((current) => ({ ...current, startsOn: event.target.value }))
            }
          />
          <Input
            type="date"
            value={newExperience.endsOn}
            onChange={(event) =>
              setNewExperience((current) => ({ ...current, endsOn: event.target.value }))
            }
          />
          <Textarea
            className="sm:col-span-2"
            value={newExperience.description}
            onChange={(event) =>
              setNewExperience((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Description (optional)"
            rows={2}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={handleAddExperience}
          disabled={mutations.saveState.isSaving}
        >
          <Plus className="size-4" />
          Add experience
        </Button>
        {fieldErrors.roleTitle ? <FormMessage>{fieldErrors.roleTitle}</FormMessage> : null}
      </ProfileSectionCard>

      <ProfileSectionCard
        id="crew-section-rates"
        title="Hourly rate"
        description="Your indicative rate for proposal matching."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="hourly-rate">
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.hourlyRateAmount}
                  onChange={(event) => updateDraft({ hourlyRateAmount: event.target.value })}
                />
              </FormControl>
              {fieldErrors.hourlyRateAmount ? (
                <FormMessage>{fieldErrors.hourlyRateAmount}</FormMessage>
              ) : null}
            </FormItem>
          </FormField>
          <FormField id="hourly-currency">
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Input
                  value={draft.hourlyRateCurrency}
                  onChange={(event) =>
                    updateDraft({ hourlyRateCurrency: event.target.value.toUpperCase() })
                  }
                  maxLength={3}
                />
              </FormControl>
            </FormItem>
          </FormField>
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        id="crew-section-verification"
        title="Identity verification (KYC)"
        description="Required before marketplace publish and operational readiness."
      >
        <div className="flex flex-wrap items-center gap-3">
          <VerificationStatusBadge status={profile.kyc?.status ?? null} label="KYC" />
          {profile.kyc?.rejected_reason ? (
            <p className="text-sm text-destructive">{profile.kyc.rejected_reason}</p>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Complete identity verification through your account settings when KYC is enabled for your region.
        </p>
      </ProfileSectionCard>

      <ProfileSectionCard
        id="crew-section-publish"
        title="Marketplace readiness"
        description="Publish state is synced from profile completion and verification."
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant={profile.marketplace_ready ? 'default' : 'outline'}>
            Marketplace {profile.marketplace_ready ? 'ready' : 'not ready'}
          </Badge>
          <Badge variant={profile.profile_published ? 'default' : 'outline'}>
            {profile.profile_published ? 'Published' : 'Not published'}
          </Badge>
        </div>
      </ProfileSectionCard>

      <ProfileSaveFooter
        isSaving={mutations.saveState.isSaving}
        isDirty={mutations.saveState.isDirty}
        error={mutations.saveState.error}
        lastSavedAt={mutations.saveState.lastSavedAt}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
