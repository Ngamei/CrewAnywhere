import { getWithdrawal } from '@/modules/payments/actions';
import { withdrawalIdParamSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = withdrawalIdParamSchema.parse(params);

  const withdrawal = await getWithdrawal(context, id);
  return ok(withdrawal, undefined, { requestId: context.requestId });
});
