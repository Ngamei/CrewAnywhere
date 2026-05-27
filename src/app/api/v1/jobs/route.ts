import { createJob } from '@/modules/jobs/actions/job-actions';
import { createJobSchema } from '@/modules/jobs/schemas';
import { created } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, createJobSchema);
  if (parsed.response) return parsed.response;

  const job = await createJob(context, parsed.data);
  return created(job, { requestId: context.requestId });
});
