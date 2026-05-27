import { sendOffer } from '@/modules/proposals/actions/proposal-actions';
import { proposalIdParamSchema, sendOfferSchema } from '@/modules/proposals/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = proposalIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, sendOfferSchema);
  if (parsed.response) return parsed.response;

  const proposal = await sendOffer(context, id, parsed.data);
  return ok(proposal, undefined, { requestId: context.requestId });
});
