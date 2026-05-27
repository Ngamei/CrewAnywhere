import { transitionJobStatus } from '@/modules/jobs/actions/job-actions';
import { jobIdParamSchema, transitionJobStatusSchema } from '@/modules/jobs/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = jobIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, transitionJobStatusSchema);
  if (parsed.response) return parsed.response;

  const job = await transitionJobStatus(context, id, parsed.data);
  return ok(job, undefined, { requestId: context.requestId });
});
