import { getCompanyProfileReadiness } from '@/modules/profiles/actions/profile-actions';
import { companyProfileIdParamSchema } from '@/modules/profiles/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = companyProfileIdParamSchema.parse(params);

  const readiness = await getCompanyProfileReadiness(context, id);
  return ok(readiness, undefined, { requestId: context.requestId });
});
