import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { WalletService } from '@/modules/payments/services';

export async function getWallet(context: AuthenticatedServiceContext, crewUserId: string) {
  return new WalletService(context).getWallet(crewUserId);
}

export async function getWalletBalance(context: AuthenticatedServiceContext, crewUserId: string) {
  return new WalletService(context).getBalanceSummary(crewUserId);
}

export async function listWalletActivity(
  context: AuthenticatedServiceContext,
  crewUserId: string,
  options: { limit?: number; cursor?: string } = {},
) {
  return new WalletService(context).listActivity(crewUserId, options);
}

export async function listWalletWithdrawals(context: AuthenticatedServiceContext, crewUserId: string) {
  return new WalletService(context).listWithdrawalStatuses(crewUserId);
}
