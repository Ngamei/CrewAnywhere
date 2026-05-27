import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import { NotFoundError } from '@/shared/api/errors';
import { assertCrewUser } from '@/shared/auth/guards';
import { assertCrewOwnership } from '@/shared/auth/ownership';
import { WalletRepository } from '@/modules/payments/repositories';
import { buildWalletActivityTitle } from '@/modules/payments/hooks/wallet-activity';
import { toPayoutStatusDisplay } from '@/modules/payments/hooks/payout-status';
import type {
  WalletActivityFeedItem,
  WalletBalanceSummaryDto,
  WalletDto,
  PayoutStatusDisplay,
} from '@/modules/payments/types';
import type { FinanceLedgerAccount } from '@/shared/state/enums/finance-ledger-account';
import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';

export class WalletService extends AuthenticatedBaseService {
  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getRepository() {
    return new WalletRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private assertWalletAccess(crewUserId: string) {
    const identity = this.requirePlatformIdentity();
    assertCrewOwnership(identity, crewUserId);
  }

  async getWallet(crewUserId: string): Promise<WalletDto> {
    this.assertWalletAccess(crewUserId);
    const repo = this.getRepository();
    const wallet = await repo.findWalletByCrewUserId(crewUserId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found for crew user.');
    }

    const balance = await repo.findBalanceByCrewUserId(crewUserId);
    return { ...wallet, balance };
  }

  async getBalanceSummary(crewUserId: string): Promise<WalletBalanceSummaryDto> {
    this.assertWalletAccess(crewUserId);
    const balance = await this.getRepository().findBalanceByCrewUserId(crewUserId);
    const wallet = await this.getRepository().findWalletByCrewUserId(crewUserId);

    if (!balance) {
      return {
        available_balance: '0.00',
        pending_balance: '0.00',
        lifetime_earnings: '0.00',
        currency: wallet?.default_currency ?? 'USD',
        last_ledger_entry_at: null,
      };
    }

    return {
      available_balance: String(balance.available_balance),
      pending_balance: String(balance.pending_balance),
      lifetime_earnings: String(balance.lifetime_earnings),
      currency: balance.currency,
      last_ledger_entry_at: balance.last_ledger_entry_at,
    };
  }

  async listActivity(
    crewUserId: string,
    options: { limit?: number; cursor?: string } = {},
  ): Promise<WalletActivityFeedItem[]> {
    this.assertWalletAccess(crewUserId);
    const rows = await this.getRepository().listWalletActivity(crewUserId, options);

    return rows.map((row) => ({
      id: row.id,
      crewUserId,
      title: buildWalletActivityTitle(row.transaction_type as FinanceTransactionType),
      description: null,
      amount: String(row.amount),
      currency: row.currency,
      direction: row.direction as 'credit' | 'debit',
      transactionType: row.transaction_type as FinanceTransactionType,
      timestamp: row.posted_at,
      paymentId: row.payment_id,
      withdrawalRequestId: row.withdrawal_request_id,
      ledgerEntryGroupId: row.ledger_entry_group_id,
    }));
  }

  async listWithdrawalStatuses(crewUserId: string): Promise<PayoutStatusDisplay[]> {
    this.assertWalletAccess(crewUserId);
    const repo = this.getRepository();
    const [withdrawals, methodLabels] = await Promise.all([
      repo.listWithdrawals(crewUserId),
      repo.listPayoutMethodLabels(crewUserId),
    ]);

    return withdrawals.map((withdrawal) =>
      toPayoutStatusDisplay(withdrawal, methodLabels.get(withdrawal.payout_method_id) ?? null),
    );
  }

  /** Resolves the authenticated crew user's wallet id for self-service routes. */
  resolveAuthenticatedCrewUserId(): string {
    const crewUser = assertCrewUser(this.requirePlatformIdentity());
    return crewUser.id;
  }
}
