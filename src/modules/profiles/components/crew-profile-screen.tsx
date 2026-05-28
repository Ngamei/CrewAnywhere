'use client';

import { useState } from 'react';
import { CrewProfileOperationalForm, ProfileOnboardingShell } from '@/modules/profiles/components';

export function CrewProfileScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ProfileOnboardingShell
      key={refreshKey}
      profileType="crew"
      title="Crew profile"
      description="Complete your profile to become operationally ready for shifts and marketplace opportunities."
    >
      <CrewProfileOperationalForm onSaved={() => setRefreshKey((value) => value + 1)} />
    </ProfileOnboardingShell>
  );
}
