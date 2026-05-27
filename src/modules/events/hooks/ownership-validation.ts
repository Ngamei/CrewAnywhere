import { NotFoundError } from '@/shared/api/errors';
import { assertCompanyOwnership } from '@/shared/auth/ownership';
import type { PlatformIdentity } from '@/shared/auth/types';
import type { EventRecord } from '@/modules/events/types/event-records';
import { CompanyProfileRepository, createProfileRepositoryClients } from '@/modules/profiles/repositories';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertCanManageCompany } from '@/modules/profiles/hooks/ownership-validation';

export async function assertEventCompanyAccess(
  supabase: SupabaseClient,
  identity: PlatformIdentity,
  companyProfileId: string,
) {
  assertCanManageCompany(identity);

  const repo = new CompanyProfileRepository(createProfileRepositoryClients(supabase));
  const company = await repo.findById(companyProfileId);

  if (!company) {
    throw new NotFoundError('Company profile not found.');
  }

  assertCompanyOwnership(identity, companyProfileId, company.owner_business_user_id);
  return company;
}

export function assertEventRecordAccess(
  identity: PlatformIdentity,
  event: EventRecord,
  ownerBusinessUserId: string,
) {
  assertCanManageCompany(identity);
  assertCompanyOwnership(identity, event.company_profile_id, ownerBusinessUserId);
}
