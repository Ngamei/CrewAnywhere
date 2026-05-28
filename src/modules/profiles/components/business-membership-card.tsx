'use client';

import { useCallback, useState } from 'react';
import { ProfileSaveFooter } from '@/modules/profiles/components/profile-save-footer';
import { ProfileSectionCard } from '@/modules/profiles/components/profile-section-card';
import { useBusinessMembership } from '@/modules/profiles/hooks/use-business-membership';
import { useProfileMutations } from '@/modules/profiles/hooks/use-profile-mutations';
import { updateBusinessMembershipSchema } from '@/modules/profiles/schemas';
import type { BusinessMembershipDto } from '@/modules/profiles/types';
import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { Badge } from '@/shared/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

type MembershipDraft = {
  firstName: string;
  lastName: string;
  phone: string;
};

export function BusinessMembershipCard() {
  const { data: membership, isLoading, error, reload } = useBusinessMembership();

  if (isLoading) {
    return <FormSectionSkeleton rows={3} />;
  }

  if (error) {
    return (
      <OperationalEmptyState
        variant="profile"
        title="Business membership unavailable"
        description={error.message}
        actionLabel="Retry"
        onAction={reload}
      />
    );
  }

  if (!membership) {
    return null;
  }

  return (
    <BusinessMembershipEditor
      key={`${membership.id}:${membership.updated_at}`}
      membership={membership}
      onSaved={reload}
    />
  );
}

function BusinessMembershipEditor({
  membership,
  onSaved,
}: {
  membership: BusinessMembershipDto;
  onSaved: () => void;
}) {
  const mutations = useProfileMutations();
  const [draft, setDraft] = useState<MembershipDraft>(() => ({
    firstName: membership.first_name ?? '',
    lastName: membership.last_name ?? '',
    phone: membership.phone ?? '',
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateDraft = useCallback(
    (patch: Partial<MembershipDraft>) => {
      setDraft((current) => ({ ...current, ...patch }));
      mutations.markDirty();
      setFieldErrors({});
    },
    [mutations],
  );

  const handleSave = useCallback(async () => {
    const payload = {
      firstName: draft.firstName.trim() || undefined,
      lastName: draft.lastName.trim() || undefined,
      phone: draft.phone.trim() || undefined,
    };
    const parsed = updateBusinessMembershipSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors({ firstName: parsed.error.issues[0]?.message ?? 'Invalid input' });
      return;
    }
    const result = await mutations.saveMembership(parsed.data);
    if (result) onSaved();
  }, [draft, mutations, onSaved]);

  return (
    <ProfileSectionCard
      id="company-section-membership"
      title="Business membership"
      description="Your role and contact details within the business account."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="secondary">Role: {membership.role}</Badge>
        {membership.canManageCompany ? (
          <Badge variant="default">Can manage company</Badge>
        ) : (
          <Badge variant="outline">View only</Badge>
        )}
        {membership.isOwner ? <Badge variant="default">Owner</Badge> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="first-name">
          <FormItem>
            <FormLabel>First name</FormLabel>
            <FormControl>
              <Input
                value={draft.firstName}
                onChange={(event) => updateDraft({ firstName: event.target.value })}
                autoComplete="given-name"
              />
            </FormControl>
            {fieldErrors.firstName ? <FormMessage>{fieldErrors.firstName}</FormMessage> : null}
          </FormItem>
        </FormField>
        <FormField id="last-name">
          <FormItem>
            <FormLabel>Last name</FormLabel>
            <FormControl>
              <Input
                value={draft.lastName}
                onChange={(event) => updateDraft({ lastName: event.target.value })}
                autoComplete="family-name"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField id="phone">
          <FormItem className="sm:col-span-2">
            <FormLabel>Phone</FormLabel>
            <FormControl>
              <Input
                value={draft.phone}
                onChange={(event) => updateDraft({ phone: event.target.value })}
                type="tel"
                autoComplete="tel"
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
        onSave={handleSave}
      />
    </ProfileSectionCard>
  );
}
