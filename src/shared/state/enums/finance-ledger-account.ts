import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.finance_ledger_account` */
export const financeLedgerAccountEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.financeLedgerAccount}`,
  values: [
    'business_cash',
    'escrow',
    'crew_wallet_pending',
    'crew_wallet_available',
    'platform_revenue',
    'refunds_payable',
    'withdrawal_clearing',
    'external_payout',
    'reconciliation',
  ] as const,
});

export const FINANCE_LEDGER_ACCOUNTS = financeLedgerAccountEnum.values;
export type FinanceLedgerAccount = PgEnumValue<typeof financeLedgerAccountEnum>;
