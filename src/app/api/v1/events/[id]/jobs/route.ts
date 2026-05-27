import { listEventJobs } from '@/modules/jobs/actions/job-actions';
import { eventIdParamSchema } from '@/modules/events/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = eventIdParamSchema.parse(params);

  const jobs = await listEventJobs(context, id);
  return ok(jobs, undefined, { requestId: context.requestId });
});
