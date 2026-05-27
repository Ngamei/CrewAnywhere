import { CrewProfileFormFoundation, ProfileOnboardingShell } from '@/modules/profiles/components';

export default function CrewProfileShellPage() {
  return (
    <ProfileOnboardingShell
      profileType="crew"
      title="Crew profile"
      description="Complete your profile to become operationally ready for shifts and marketplace opportunities."
    >
      <CrewProfileFormFoundation />
    </ProfileOnboardingShell>
  );
}
