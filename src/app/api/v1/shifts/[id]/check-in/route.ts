import { checkInShift } from '@/modules/shifts/actions/shift-actions';
import { shiftAttendanceSchema, shiftIdParamSchema } from '@/modules/shifts/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = shiftIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, shiftAttendanceSchema.partial());
  if (parsed.response) return parsed.response;

  const shift = await checkInShift(context, id, parsed.data);
  return ok(shift, undefined, { requestId: context.requestId });
});
