import { CompanyProfileFormFoundation, ProfileOnboardingShell } from '@/modules/profiles/components';

/** MVP: company profile id resolved from membership API in a follow-up; pass when known. */
const COMPANY_PROFILE_ID_PLACEHOLDER = '';

export default function CompanyProfileShellPage() {
  return (
    <ProfileOnboardingShell
      profileType="company"
      companyProfileId={COMPANY_PROFILE_ID_PLACEHOLDER}
      title="Company profile"
      description="Complete business onboarding to publish jobs and manage crew operations."
    >
      <CompanyProfileFormFoundation />
    </ProfileOnboardingShell>
  );
}
