import { definePgEnum, type PgEnumValue } from './define-pg-enum';

/**
 * Company profile lifecycle stored as `public.company_status`.
 *
 * @see schema.sql — `public.company_status`
 */
export const companyStatusEnum = definePgEnum({
  pgType: 'public.company_status',
  values: ['draft', 'active', 'suspended', 'deleted'] as const,
});

export const COMPANY_STATUSES = companyStatusEnum.values;
export type CompanyStatus = PgEnumValue<typeof companyStatusEnum>;
