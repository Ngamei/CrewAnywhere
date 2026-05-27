/**
 * PostgreSQL enum type names (public schema).
 * Mirror of `schema.sql` — update when migrations change enum definitions.
 */
export const PG_ENUM_NAMES = {
  proposalStatus: 'proposal_status',
  assignmentStatus: 'assignment_status',
  shiftStatus: 'shift_status',
  paymentStatus: 'payment_status',
  withdrawalStatus: 'withdrawal_status',
  escrowStatus: 'escrow_status',
  verificationStatus: 'verification_status',
  workflowEntityType: 'workflow_entity_type',
  workflowTransitionSource: 'workflow_transition_source',
  financeTransactionType: 'finance_transaction_type',
  financeLedgerAccount: 'finance_ledger_account',
  financeEntryDirection: 'finance_entry_direction',
} as const;

export type PgEnumName = (typeof PG_ENUM_NAMES)[keyof typeof PG_ENUM_NAMES];
