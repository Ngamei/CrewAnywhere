import { listMyProposals, submitProposal } from '@/modules/proposals/actions/proposal-actions';
import { submitProposalSchema } from '@/modules/proposals/schemas';
import { created, ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context) => {
  const proposals = await listMyProposals(context);
  return ok(proposals, undefined, { requestId: context.requestId });
});

export const POST = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, submitProposalSchema);
  if (parsed.response) return parsed.response;

  const proposal = await submitProposal(context, parsed.data);
  return created(proposal, { requestId: context.requestId });
});
