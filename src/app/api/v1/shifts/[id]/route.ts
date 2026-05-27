import { getShift } from '@/modules/shifts/actions/shift-actions';
import { shiftIdParamSchema } from '@/modules/shifts/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = shiftIdParamSchema.parse(params);

  const shift = await getShift(context, id);
  return ok(shift, undefined, { requestId: context.requestId });
});
