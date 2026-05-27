import { AppError } from '@/shared/api/errors';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import type { WithdrawalActivityRecord } from '@/modules/payments/types/withdrawal-activity-records';
import { buildWithdrawalActivityFromLedgerLines } from '@/modules/payments/types/withdrawal-activity-records';
import type { PaymentRecord, WithdrawalRequestRecord } from '@/modules/payments/types/payment-records';
import { LedgerPostingService, type LedgerPostingContext } from './ledger-posting.service';
import { isPostedGroupBalanced } from './ledger-posting-helpers';

export type WithdrawalLedgerResult = {
  ledgerGroupId: string;
  activity: WithdrawalActivityRecord;
  replayed: boolean;
};

/**
 * Posts immutable ledger groups for withdrawal reservation, payout, and reversal.
 */
export class WithdrawalLedgerService {
  private readonly ledger: LedgerPostingService;

  constructor(private readonly context: AuthenticatedServiceContext) {
    this.ledger = new LedgerPostingService(context);
  }

  private postingContext(
    withdrawal: WithdrawalRequestRecord,
    payment: PaymentRecord,
    commandId: string,
  ): LedgerPostingContext {
    return {
      paymentId: payment.id,
      withdrawalRequestId: withdrawal.id,
      companyProfileId: withdrawal.company_profile_id,
      crewUserId: withdrawal.crew_user_id,
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      commandId,
    };
  }

  async postReservation(
    withdrawal: WithdrawalRequestRecord,
    payment: PaymentRecord,
    commandId: string,
  ): Promise<WithdrawalLedgerResult> {
    const ctx = this.postingContext(withdrawal, payment, commandId);
    const posted = await this.ledger.postWithdrawalReservation(ctx);
    const activity = buildWithdrawalActivityFromLedgerLines(posted.lines, {
      replayed: posted.replayed,
    });

    if (!activity) {
      throw new AppError('LEDGER_ACTIVITY_MISSING', 'Withdrawal reservation produced no activity.', 422);
    }

    if (!isPostedGroupBalanced(posted.lines)) {
      throw new AppError(
        'LEDGER_GROUP_UNBALANCED',
        `Withdrawal reservation group ${posted.ledgerEntryGroupId} is not balanced.`,
        422,
      );
    }

    return {
      ledgerGroupId: posted.ledgerEntryGroupId,
      activity,
      replayed: posted.replayed,
    };
  }

  async postPayout(
    withdrawal: WithdrawalRequestRecord,
    payment: PaymentRecord,
    commandId: string,
  ): Promise<WithdrawalLedgerResult> {
    const ctx = this.postingContext(withdrawal, payment, commandId);
    const posted = await this.ledger.postWithdrawalPayout(ctx);
    const activity = buildWithdrawalActivityFromLedgerLines(posted.lines, {
      replayed: posted.replayed,
    });

    if (!activity) {
      throw new AppError('LEDGER_ACTIVITY_MISSING', 'Withdrawal payout produced no activity.', 422);
    }

    return {
      ledgerGroupId: posted.ledgerEntryGroupId,
      activity,
      replayed: posted.replayed,
    };
  }

  async postReservationReversal(
    withdrawal: WithdrawalRequestRecord,
    payment: PaymentRecord,
    commandId: string,
  ): Promise<WithdrawalLedgerResult> {
    const ctx = this.postingContext(withdrawal, payment, commandId);
    const posted = await this.ledger.postWithdrawalReservationReversal(ctx);
    const activity = buildWithdrawalActivityFromLedgerLines(posted.lines, {
      replayed: posted.replayed,
    });

    if (!activity) {
      throw new AppError('LEDGER_ACTIVITY_MISSING', 'Withdrawal reversal produced no activity.', 422);
    }

    return {
      ledgerGroupId: posted.ledgerEntryGroupId,
      activity,
      replayed: posted.replayed,
    };
  }
}
