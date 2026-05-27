import { listWalletActivity } from '@/modules/payments/actions/wallet-actions';
import { crewUserIdParamSchema, walletActivityQuerySchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { crewUserId } = crewUserIdParamSchema.parse(params);
  const url = new URL(request.url);
  const query = walletActivityQuerySchema.parse({
    limit: url.searchParams.get('limit') ?? undefined,
    cursor: url.searchParams.get('cursor') ?? undefined,
  });

  const activity = await listWalletActivity(context, crewUserId, query);
  return ok(activity, undefined, { requestId: context.requestId });
});
