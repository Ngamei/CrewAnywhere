import { updateCompanyFinance } from '@/modules/profiles/actions/profile-actions';
import { companyProfileIdParamSchema, updateCompanyFinanceSchema } from '@/modules/profiles/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const PATCH = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = companyProfileIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, updateCompanyFinanceSchema);
  if (parsed.response) return parsed.response;

  const profile = await updateCompanyFinance(context, id, parsed.data);
  return ok(profile, undefined, { requestId: context.requestId });
});
