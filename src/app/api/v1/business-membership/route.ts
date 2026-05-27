import {
  getCurrentBusinessMembership,
  updateCurrentBusinessMembership,
} from '@/modules/profiles/actions/profile-actions';
import { updateBusinessMembershipSchema } from '@/modules/profiles/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context) => {
  const membership = await getCurrentBusinessMembership(context);
  return ok(membership, undefined, { requestId: context.requestId });
});

export const PATCH = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, updateBusinessMembershipSchema);
  if (parsed.response) return parsed.response;

  const membership = await updateCurrentBusinessMembership(context, parsed.data);
  return ok(membership, undefined, { requestId: context.requestId });
});
