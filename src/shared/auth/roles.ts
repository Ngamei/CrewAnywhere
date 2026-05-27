import type { AccountType, BusinessRole } from '@/shared/auth/enums';

/** Application roles used for authorization guards and policy checks. */
export const USER_ROLES = [
  'platform_admin',
  'business_owner',
  'business_member',
  'crew',
  'supervisor',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Mirrors `public.account_type` — primary actor classification. */
export const USER_TYPES = ['business', 'crew', 'admin'] as const;
export type UserType = (typeof USER_TYPES)[number];

const OPERATIONS_ROLES: ReadonlySet<UserRole> = new Set([
  'platform_admin',
  'business_owner',
  'supervisor',
]);

const BILLING_ROLES: ReadonlySet<UserRole> = new Set(['platform_admin', 'business_owner']);

const ADMIN_ROLES: ReadonlySet<UserRole> = new Set(['platform_admin']);

const BUSINESS_ROLES: ReadonlySet<UserRole> = new Set([
  'platform_admin',
  'business_owner',
  'business_member',
  'supervisor',
]);

/**
 * Maps database account type + business role to the application role used by guards.
 * `supervisor` is reserved for operational context (e.g. shift supervision), not account signup.
 */
export function resolveAppRole(input: {
  accountType: AccountType;
  businessRole?: BusinessRole | null;
}): UserRole {
  const { accountType, businessRole } = input;

  if (accountType === 'admin') {
    return 'platform_admin';
  }

  if (accountType === 'crew') {
    return 'crew';
  }

  switch (businessRole) {
    case 'owner':
    case 'admin':
      return 'business_owner';
    case 'member':
      return 'business_member';
    default:
      return 'business_member';
  }
}

export function accountTypeToUserType(accountType: AccountType): UserType {
  return accountType;
}

export function canAccessOperations(role: UserRole) {
  return OPERATIONS_ROLES.has(role);
}

export function canManageBilling(role: UserRole) {
  return BILLING_ROLES.has(role);
}

export function isPlatformAdmin(role: UserRole) {
  return ADMIN_ROLES.has(role);
}

export function isBusinessActor(role: UserRole) {
  return BUSINESS_ROLES.has(role);
}

export function isCrewActor(role: UserRole) {
  return role === 'crew';
}

export function hasRole(role: UserRole, allowed: readonly UserRole[]) {
  return allowed.includes(role);
}
