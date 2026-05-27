import { ForbiddenError } from '@/shared/api/errors';
import type { PlatformIdentity, PlatformSession } from '@/shared/auth/types';
import { assertPermission, type Permission } from '@/shared/auth/permissions';
import {
  assertAccountType,
  assertActiveAccount,
  assertAuthenticated,
  assertRole,
} from '@/shared/auth/guards';
import type { UserRole } from '@/shared/auth/roles';
import type { WorkflowTransitionSource } from '@/shared/state/enums/workflow-transition-source';

export function requirePermission(session: PlatformSession | null, permission: Permission) {
  assertAuthenticated(session);
  assertActiveAccount(session.identity);

  try {
    assertPermission(session.identity.role, permission);
  } catch {
    throw new ForbiddenError();
  }
}

export function requireRoles(session: PlatformSession | null, roles: readonly UserRole[]) {
  assertAuthenticated(session);
  assertActiveAccount(session.identity);
  assertRole(session.identity, roles);
}

export function requireAccountTypes(
  session: PlatformSession | null,
  accountTypes: Parameters<typeof assertAccountType>[1],
) {
  assertAuthenticated(session);
  assertActiveAccount(session.identity);
  assertAccountType(session.identity, accountTypes);
}

/** Maps platform identity to workflow transition source for atomic transition RPC. */
export function resolveWorkflowTransitionSource(identity: PlatformIdentity): WorkflowTransitionSource {
  if (identity.accountType === 'admin') {
    return 'admin';
  }

  if (identity.accountType === 'crew') {
    return 'crew_user';
  }

  return 'business_user';
}

export function getTransitionedByAuthAccountId(identity: PlatformIdentity) {
  return identity.authAccount.id;
}
