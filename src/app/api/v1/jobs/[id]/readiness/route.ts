import { getJobReadiness } from '@/modules/jobs/actions/job-actions';
import { jobIdParamSchema } from '@/modules/jobs/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = jobIdParamSchema.parse(params);

  const readiness = await getJobReadiness(context, id);
  return ok(readiness, undefined, { requestId: context.requestId });
});
