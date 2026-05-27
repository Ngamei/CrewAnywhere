import { listJobProposals } from '@/modules/proposals/actions/proposal-actions';
import { jobIdParamSchema } from '@/modules/jobs/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = jobIdParamSchema.parse(params);

  const proposals = await listJobProposals(context, id);
  return ok(proposals, undefined, { requestId: context.requestId });
});
