import type { CompanyStatus } from '@/shared/state/enums/company-status';
import type { VerificationStatus } from '@/shared/state/enums/verification-status';
import type { BusinessRole } from '@/shared/auth/enums';

/** Row shape for `public.company_profiles`. */
export type CompanyProfileRecord = {
  id: string;
  owner_business_user_id: string;
  company_name: string;
  legal_name: string | null;
  registration_number: string | null;
  website_url: string | null;
  description: string | null;
  country_code: string | null;
  status: CompanyStatus;
  business_ready: boolean;
  verified_business: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.business_finance_records`. */
export type BusinessFinanceRecord = {
  id: string;
  company_profile_id: string;
  billing_email: string | null;
  tax_identifier: string | null;
  tax_country_code: string | null;
  default_currency: string;
  payment_setup_completed: boolean;
  tax_setup_completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.kyb_records` (read paths). */
export type KybRecord = {
  id: string;
  company_profile_id: string;
  status: VerificationStatus;
  status_version: number;
  provider: string | null;
  provider_reference: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.crew_profiles`. */
export type CrewProfileRecord = {
  id: string;
  crew_user_id: string;
  display_name: string;
  legal_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  city: string | null;
  country_code: string | null;
  introduction: string | null;
  profile_image_url: string | null;
  hourly_rate_amount: number | null;
  hourly_rate_currency: string;
  profile_published: boolean;
  marketplace_ready: boolean;
  profile_score: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.crew_skills`. */
export type CrewSkillRecord = {
  id: string;
  crew_user_id: string;
  skill_name: string;
  skill_category: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.crew_experience`. */
export type CrewExperienceRecord = {
  id: string;
  crew_user_id: string;
  company_name: string | null;
  role_title: string;
  description: string | null;
  starts_on: string | null;
  ends_on: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.kyc_records` (read paths). */
export type KycRecord = {
  id: string;
  crew_user_id: string;
  status: VerificationStatus;
  status_version: number;
  document_type: string | null;
  provider: string | null;
  provider_reference: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Business user with role — membership context for company operations. */
export type BusinessMembershipRecord = {
  id: string;
  auth_account_id: string;
  role: BusinessRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
