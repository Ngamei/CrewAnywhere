import { ForbiddenError } from '@/shared/api/errors';
import type { BusinessRole } from '@/shared/auth/enums';
import { assertCompanyOwnership, assertCrewOwnership } from '@/shared/auth/ownership';
import { hasPermission, PERMISSIONS } from '@/shared/auth/permissions';
import type { PlatformIdentity } from '@/shared/auth/types';
import type { CompanyProfileRecord } from '@/modules/profiles/types/profile-records';

const COMPANY_MANAGE_ROLES: ReadonlySet<BusinessRole> = new Set(['owner', 'admin']);

export function assertCanManageCompany(identity: PlatformIdentity) {
  if (!hasPermission(identity.role, PERMISSIONS.companyManage)) {
    throw new ForbiddenError('Company management permission is required.');
  }
}

export function assertCompanyProfileAccess(
  identity: PlatformIdentity,
  profile: CompanyProfileRecord,
) {
  assertCompanyOwnership(identity, profile.id, profile.owner_business_user_id);
}

export function assertBusinessRoleCanManageCompany(role: BusinessRole) {
  if (!COMPANY_MANAGE_ROLES.has(role)) {
    throw new ForbiddenError('Business role cannot manage company profiles.');
  }
}

export function assertCrewProfileAccess(identity: PlatformIdentity, crewUserId: string) {
  assertCrewOwnership(identity, crewUserId);
}

export function assertCanAccessCrewMarketplace(identity: PlatformIdentity) {
  if (!hasPermission(identity.role, PERMISSIONS.crewMarketplace)) {
    throw new ForbiddenError('Crew marketplace permission is required.');
  }
}
