import { discoverMarketplaceJobs } from '@/modules/marketplace/actions/marketplace-actions';
import { marketplaceDiscoveryQuerySchema } from '@/modules/marketplace/schemas/discovery.schema';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (request, context) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const filters = marketplaceDiscoveryQuerySchema.parse(params);

  const result = await discoverMarketplaceJobs(context, filters);
  return ok(result, undefined, { requestId: context.requestId });
});
