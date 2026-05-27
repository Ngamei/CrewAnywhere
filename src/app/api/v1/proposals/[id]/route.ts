import { getProposal } from '@/modules/proposals/actions/proposal-actions';
import { proposalIdParamSchema } from '@/modules/proposals/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = proposalIdParamSchema.parse(params);

  const proposal = await getProposal(context, id);
  return ok(proposal, undefined, { requestId: context.requestId });
});
