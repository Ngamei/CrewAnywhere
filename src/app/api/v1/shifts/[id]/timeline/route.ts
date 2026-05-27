import { getShiftTimeline } from '@/modules/shifts/actions/shift-actions';
import { shiftIdParamSchema } from '@/modules/shifts/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = shiftIdParamSchema.parse(params);

  const timeline = await getShiftTimeline(context, id);
  return ok(timeline, undefined, { requestId: context.requestId });
});
