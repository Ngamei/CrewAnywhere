import { listWalletWithdrawals } from '@/modules/payments/actions/wallet-actions';
import { crewUserIdParamSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { crewUserId } = crewUserIdParamSchema.parse(params);

  const withdrawals = await listWalletWithdrawals(context, crewUserId);
  return ok(withdrawals, undefined, { requestId: context.requestId });
});
