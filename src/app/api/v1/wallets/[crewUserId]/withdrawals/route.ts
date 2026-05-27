import { listWalletWithdrawals } from '@/modules/payments/actions/wallet-actions';
import { requestWithdrawal } from '@/modules/payments/actions';
import { crewUserIdParamSchema, createWithdrawalSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { crewUserId } = crewUserIdParamSchema.parse(params);

  const withdrawals = await listWalletWithdrawals(context, crewUserId);
  return ok(withdrawals, undefined, { requestId: context.requestId });
});

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { crewUserId } = crewUserIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, createWithdrawalSchema);
  if (parsed.response) return parsed.response;

  const result = await requestWithdrawal(context, crewUserId, parsed.data);
  return ok(result, undefined, { requestId: context.requestId });
});
