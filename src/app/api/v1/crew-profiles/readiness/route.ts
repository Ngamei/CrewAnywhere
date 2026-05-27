import { getCrewProfileReadiness } from '@/modules/profiles/actions/profile-actions';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context) => {
  const readiness = await getCrewProfileReadiness(context);
  return ok(readiness, undefined, { requestId: context.requestId });
});
