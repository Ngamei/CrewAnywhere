import { declineProposal } from '@/modules/proposals/actions/proposal-actions';
import { proposalIdParamSchema } from '@/modules/proposals/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';
import { z } from 'zod';

const declineBodySchema = z.object({
  mode: z.enum(['application', 'offer']),
  reason: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = proposalIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, declineBodySchema);
  if (parsed.response) return parsed.response;

  const proposal = await declineProposal(
    context,
    id,
    parsed.data.mode,
    parsed.data.reason,
    parsed.data.idempotencyKey,
  );
  return ok(proposal, undefined, { requestId: context.requestId });
});
