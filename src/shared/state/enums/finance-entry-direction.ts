import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.finance_entry_direction` */
export const financeEntryDirectionEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.financeEntryDirection}`,
  values: ['debit', 'credit'] as const,
});

export const FINANCE_ENTRY_DIRECTIONS = financeEntryDirectionEnum.values;
export type FinanceEntryDirection = PgEnumValue<typeof financeEntryDirectionEnum>;
