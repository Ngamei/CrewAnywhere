import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.finance_transaction_type` */
export const financeTransactionTypeEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.financeTransactionType}`,
  values: [
    'escrow_funding',
    'escrow_release',
    'wallet_credit',
    'wallet_debit',
    'refund',
    'withdrawal',
    'withdrawal_payout',
    'platform_fee',
    'dispute_hold',
    'dispute_release',
    'reversal',
    'reconciliation_adjustment',
  ] as const,
});

export const FINANCE_TRANSACTION_TYPES = financeTransactionTypeEnum.values;
export type FinanceTransactionType = PgEnumValue<typeof financeTransactionTypeEnum>;
