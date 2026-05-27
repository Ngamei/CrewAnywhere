import { getCrewStaffingAvailability } from '@/modules/marketplace/actions/marketplace-actions';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context) => {
  const availability = await getCrewStaffingAvailability(context);
  return ok(availability, undefined, { requestId: context.requestId });
});
