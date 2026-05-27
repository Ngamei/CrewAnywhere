import { ForbiddenError, UnauthorizedError } from '@/shared/api/errors';
import type { AccountType } from '@/shared/auth/enums';
import { isAccountEligible } from '@/shared/auth/permissions';
import { hasRole, type UserRole } from '@/shared/auth/roles';
import type { PlatformIdentity, PlatformSession } from '@/shared/auth/types';

export function assertAuthenticated(session: PlatformSession | null): asserts session is PlatformSession {
  if (!session) {
    throw new UnauthorizedError();
  }
}

export function assertActiveAccount(identity: PlatformIdentity) {
  if (!isAccountEligible(identity.authAccount.status)) {
    throw new ForbiddenError('Account is not active.');
  }
}

export function assertRole(identity: PlatformIdentity, allowed: readonly UserRole[]) {
  if (!hasRole(identity.role, allowed)) {
    throw new ForbiddenError('Insufficient role for this action.');
  }
}

export function assertAccountType(identity: PlatformIdentity, allowed: readonly AccountType[]) {
  if (!allowed.includes(identity.accountType)) {
    throw new ForbiddenError('Account type is not permitted for this action.');
  }
}

export function assertBusinessUser(identity: PlatformIdentity) {
  if (!identity.businessUser) {
    throw new ForbiddenError('Business user context is required.');
  }

  return identity.businessUser;
}

export function assertCrewUser(identity: PlatformIdentity) {
  if (!identity.crewUser) {
    throw new ForbiddenError('Crew user context is required.');
  }

  return identity.crewUser;
}

export function assertPlatformAdmin(identity: PlatformIdentity) {
  assertRole(identity, ['platform_admin']);
}
