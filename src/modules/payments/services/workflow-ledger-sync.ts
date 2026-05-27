import { AppError } from '@/shared/api/errors';
import type { EscrowStatus } from '@/shared/state/enums/escrow-status';
import type { PaymentStatus } from '@/shared/state/enums/payment-status';
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
