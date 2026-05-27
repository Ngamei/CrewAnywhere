import { getJob, updateJob } from '@/modules/jobs/actions/job-actions';
import { jobIdParamSchema, updateJobSchema } from '@/modules/jobs/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = jobIdParamSchema.parse(params);

  const job = await getJob(context, id);
  return ok(job, undefined, { requestId: context.requestId });
});

export const PATCH = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = jobIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, updateJobSchema);
  if (parsed.response) return parsed.response;

  const job = await updateJob(context, id, parsed.data);
  return ok(job, undefined, { requestId: context.requestId });
});
