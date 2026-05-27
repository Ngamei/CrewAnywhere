import { ForbiddenError } from '@/shared/api/errors';
import { canAccessOperations, canManageBilling, type UserRole } from '@/shared/auth/roles';
import type { PlatformIdentity } from '@/shared/auth/types';

export function assertOperationsAccess(role: UserRole) {
  if (!canAccessOperations(role)) {
    throw new ForbiddenError('Operations access is required.');
  }
}

export function assertBillingAccess(role: UserRole) {
  if (!canManageBilling(role)) {
    throw new ForbiddenError('Billing access is required.');
  }
}

export function assertIdentityOperationsAccess(identity: PlatformIdentity) {
  assertOperationsAccess(identity.role);
}

export function assertIdentityBillingAccess(identity: PlatformIdentity) {
  assertBillingAccess(identity.role);
}
