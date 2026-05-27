import { assignmentStatusEnum } from './assignment-status';
import { escrowStatusEnum } from './escrow-status';
import { financeEntryDirectionEnum } from './finance-entry-direction';
import { financeLedgerAccountEnum } from './finance-ledger-account';
import { financeTransactionTypeEnum } from './finance-transaction-type';
import { paymentStatusEnum } from './payment-status';
import { proposalStatusEnum } from './proposal-status';
import { shiftStatusEnum } from './shift-status';
import { verificationStatusEnum } from './verification-status';
import { withdrawalStatusEnum } from './withdrawal-status';
import { workflowEntityTypeEnum } from './workflow-entity-type';
import { workflowTransitionSourceEnum } from './workflow-transition-source';

/**
 * Central registry of workflow/finance Postgres enums for introspection,
 * validation, and future codegen. Values are defined once per module above.
 */
export const WORKFLOW_PG_ENUM_REGISTRY = {
  proposalStatus: proposalStatusEnum,
  assignmentStatus: assignmentStatusEnum,
  shiftStatus: shiftStatusEnum,
  paymentStatus: paymentStatusEnum,
  withdrawalStatus: withdrawalStatusEnum,
  escrowStatus: escrowStatusEnum,
  verificationStatus: verificationStatusEnum,
  kybStatus: verificationStatusEnum,
  kycStatus: verificationStatusEnum,
  workflowEntityType: workflowEntityTypeEnum,
  workflowTransitionSource: workflowTransitionSourceEnum,
  financeTransactionType: financeTransactionTypeEnum,
  financeLedgerAccount: financeLedgerAccountEnum,
  financeEntryDirection: financeEntryDirectionEnum,
} as const;

export type WorkflowPgEnumRegistryKey = keyof typeof WORKFLOW_PG_ENUM_REGISTRY;
