import { definePgEnum, type PgEnumValue } from '@/shared/state/enums/define-pg-enum';

/** @see schema.sql — `public.account_type` */
export const accountTypeEnum = definePgEnum({
  pgType: 'public.account_type',
  values: ['business', 'crew', 'admin'] as const,
});

export const ACCOUNT_TYPES = accountTypeEnum.values;
export type AccountType = PgEnumValue<typeof accountTypeEnum>;

/** @see schema.sql — `public.account_status` */
export const accountStatusEnum = definePgEnum({
  pgType: 'public.account_status',
  values: ['pending_verification', 'active', 'suspended', 'deleted'] as const,
});

export const ACCOUNT_STATUSES = accountStatusEnum.values;
export type AccountStatus = PgEnumValue<typeof accountStatusEnum>;

/** @see schema.sql — `public.business_role` */
export const businessRoleEnum = definePgEnum({
  pgType: 'public.business_role',
  values: ['owner', 'admin', 'member'] as const,
});

export const BUSINESS_ROLES = businessRoleEnum.values;
export type BusinessRole = PgEnumValue<typeof businessRoleEnum>;

/** @see schema.sql — `public.account_provider` */
export const accountProviderEnum = definePgEnum({
  pgType: 'public.account_provider',
  values: ['email', 'google', 'linkedin'] as const,
});

export const ACCOUNT_PROVIDERS = accountProviderEnum.values;
export type AccountProvider = PgEnumValue<typeof accountProviderEnum>;
