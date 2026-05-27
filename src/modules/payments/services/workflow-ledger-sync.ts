import { AppError } from '@/shared/api/errors';
import type { EscrowStatus } from '@/shared/state/enums/escrow-status';
import type { PaymentStatus } from '@/shared/state/enums/payment-status';
import type { WithdrawalStatus } from '@/shared/state/enums/withdrawal-status';
import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';
import type { FinanceTransactionRecord } from '@/modules/payments/types/finance-transaction-records';
import { LedgerRepository } from '@/modules/payments/repositories';
import { isPostedGroupBalanced } from './ledger-posting-helpers';

export type WorkflowLedgerSyncInput = {
  paymentId: string;
  paymentStatus: PaymentStatus;
  escrowStatus: EscrowStatus | null;
  ledgerLines: FinanceTransactionRecord[];
  expectedTransactionTypes: FinanceTransactionType[];
};

/**
 * Validates payment workflow state, escrow row state, and posted ledger groups stay aligned.
 */
export function assertWorkflowLedgerSynchronized(input: WorkflowLedgerSyncInput): void {
  const grouped = groupLinesByLedgerGroup(input.ledgerLines);

  for (const lines of grouped.values()) {
    if (!isPostedGroupBalanced(lines)) {
      throw new AppError(
        'LEDGER_WORKFLOW_DESYNC',
        `Ledger group ${lines[0]?.ledger_entry_group_id} is not balanced for payment ${input.paymentId}.`,
        422,
      );
    }
  }

  const postedTypes = new Set(input.ledgerLines.map((line) => line.transaction_type));

  for (const expected of input.expectedTransactionTypes) {
    if (!postedTypes.has(expected)) {
      throw new AppError(
        'LEDGER_WORKFLOW_DESYNC',
        `Expected posted ledger type ${expected} for payment ${input.paymentId}.`,
        422,
      );
    }
  }

  if (input.paymentStatus === 'funded' || input.paymentStatus === 'released') {
    if (input.escrowStatus !== 'funded' && input.escrowStatus !== 'held' && input.escrowStatus !== 'released') {
      throw new AppError(
        'ESCROW_WORKFLOW_DESYNC',
        `Payment ${input.paymentId} is ${input.paymentStatus} but escrow is ${input.escrowStatus ?? 'missing'}.`,
        422,
      );
    }
  }

  if (input.paymentStatus === 'released' && input.escrowStatus !== 'released') {
    throw new AppError(
      'ESCROW_WORKFLOW_DESYNC',
      `Payment ${input.paymentId} is released but escrow is ${input.escrowStatus ?? 'missing'}.`,
      422,
    );
  }
}

export async function loadPaymentLedgerLines(
  ledger: LedgerRepository,
  paymentId: string,
): Promise<FinanceTransactionRecord[]> {
  return ledger.listByPaymentId(paymentId);
}

function groupLinesByLedgerGroup(
  lines: FinanceTransactionRecord[],
): Map<string, FinanceTransactionRecord[]> {
  const groups = new Map<string, FinanceTransactionRecord[]>();
  for (const line of lines) {
    const bucket = groups.get(line.ledger_entry_group_id) ?? [];
    bucket.push(line);
    groups.set(line.ledger_entry_group_id, bucket);
  }
  return groups;
}

export type WithdrawalWorkflowLedgerSyncInput = {
  withdrawalId: string;
  withdrawalStatus: WithdrawalStatus;
  ledgerLines: FinanceTransactionRecord[];
};

/**
 * Validates withdrawal workflow state and posted ledger groups stay aligned.
 */
export function assertWithdrawalWorkflowLedgerSynchronized(
  input: WithdrawalWorkflowLedgerSyncInput,
): void {
  const grouped = groupLinesByLedgerGroup(input.ledgerLines);

  for (const lines of grouped.values()) {
    if (!isPostedGroupBalanced(lines)) {
      throw new AppError(
        'LEDGER_WORKFLOW_DESYNC',
        `Ledger group ${lines[0]?.ledger_entry_group_id} is not balanced for withdrawal ${input.withdrawalId}.`,
        422,
      );
    }
  }

  const postedTypes = new Set(input.ledgerLines.map((line) => line.transaction_type));

  if (input.withdrawalStatus === 'approved' || input.withdrawalStatus === 'processing') {
    if (!postedTypes.has('withdrawal')) {
      throw new AppError(
        'LEDGER_WORKFLOW_DESYNC',
        `Withdrawal ${input.withdrawalId} is ${input.withdrawalStatus} but reservation ledger is missing.`,
        422,
      );
    }
  }

  if (input.withdrawalStatus === 'paid' && !postedTypes.has('withdrawal_payout')) {
    throw new AppError(
      'LEDGER_WORKFLOW_DESYNC',
      `Withdrawal ${input.withdrawalId} is paid but payout ledger is missing.`,
      422,
    );
  }
}

export async function loadWithdrawalLedgerLines(
  ledger: LedgerRepository,
  withdrawalRequestId: string,
): Promise<FinanceTransactionRecord[]> {
  return ledger.listByWithdrawalRequestId(withdrawalRequestId);
}
