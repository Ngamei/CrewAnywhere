import type { AccountStatus } from '@/shared/auth/enums';
import {
  canAccessOperations,
  canManageBilling,
  isBusinessActor,
  isCrewActor,
  isPlatformAdmin,
  type UserRole,
} from '@/shared/auth/roles';

export const PERMISSIONS = {
  operations: 'operations',
  billing: 'billing',
  workflowTransition: 'workflow_transition',
  companyManage: 'company_manage',
  crewMarketplace: 'crew_marketplace',
  platformAdmin: 'platform_admin',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const PERMISSION_ROLE_MAP: Record<Permission, (role: UserRole) => boolean> = {
  [PERMISSIONS.operations]: canAccessOperations,
  [PERMISSIONS.billing]: canManageBilling,
  [PERMISSIONS.workflowTransition]: (role) =>
    isPlatformAdmin(role) || isBusinessActor(role) || isCrewActor(role),
  [PERMISSIONS.companyManage]: (role) => isPlatformAdmin(role) || role === 'business_owner',
  [PERMISSIONS.crewMarketplace]: (role) => isCrewActor(role) || isPlatformAdmin(role),
  [PERMISSIONS.platformAdmin]: isPlatformAdmin,
};

export function hasPermission(role: UserRole, permission: Permission) {
  return PERMISSION_ROLE_MAP[permission](role);
}

export function assertPermission(role: UserRole, permission: Permission, message?: string) {
  if (!hasPermission(role, permission)) {
    throw new Error(message ?? `Missing permission: ${permission}`);
  }
}

/** Account must be active (not suspended/deleted) to perform marketplace actions. */
export function isAccountEligible(status: AccountStatus) {
  return status === 'active';
}

export function canAuthenticate(status: AccountStatus) {
  return status === 'active' || status === 'pending_verification';
}
