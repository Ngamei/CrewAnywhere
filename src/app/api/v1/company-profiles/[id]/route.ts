import {
  getCompanyProfile,
  updateCompanyProfile,
} from '@/modules/profiles/actions/profile-actions';
import { companyProfileIdParamSchema, updateCompanyProfileSchema } from '@/modules/profiles/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = companyProfileIdParamSchema.parse(params);

  const profile = await getCompanyProfile(context, id);
  return ok(profile, undefined, { requestId: context.requestId });
});

export const PATCH = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = companyProfileIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, updateCompanyProfileSchema);
  if (parsed.response) return parsed.response;

  const profile = await updateCompanyProfile(context, id, parsed.data);
  return ok(profile, undefined, { requestId: context.requestId });
});
