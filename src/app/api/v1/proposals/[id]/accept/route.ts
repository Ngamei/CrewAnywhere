import { acceptOffer } from '@/modules/proposals/actions/proposal-actions';
import { proposalIdParamSchema, proposalTransitionSchema } from '@/modules/proposals/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = proposalIdParamSchema.parse(params);

  const parsed = await parseJsonBody(
    request,
    proposalTransitionSchema.pick({ reason: true, idempotencyKey: true }).partial(),
  );
  if (parsed.response) return parsed.response;

  const proposal = await acceptOffer(context, id, parsed.data?.reason, parsed.data?.idempotencyKey);
  return ok(proposal, undefined, { requestId: context.requestId });
});
