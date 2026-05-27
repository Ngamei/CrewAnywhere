import { listPayoutMethods } from '@/modules/payments/actions';
import { crewUserIdParamSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { crewUserId } = crewUserIdParamSchema.parse(params);

  const methods = await listPayoutMethods(context, crewUserId);
  return ok(methods, undefined, { requestId: context.requestId });
});
