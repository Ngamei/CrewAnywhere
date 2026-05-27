import { listShiftsForAssignment, scheduleShiftFromAssignment } from '@/modules/shifts/actions/shift-actions';
import { assignmentIdParamSchema, scheduleShiftSchema } from '@/modules/shifts/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = assignmentIdParamSchema.parse(params);

  const shifts = await listShiftsForAssignment(context, id);
  return ok(shifts, undefined, { requestId: context.requestId });
});

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = assignmentIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, scheduleShiftSchema.partial());
  if (parsed.response) return parsed.response;

  const shift = await scheduleShiftFromAssignment(context, id, parsed.data);
  return ok(shift, undefined, { requestId: context.requestId });
});
