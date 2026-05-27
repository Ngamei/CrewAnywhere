import { getAssignment } from '@/modules/assignments/actions/assignment-actions';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';
import { z } from 'zod';

const assignmentIdParamSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = assignmentIdParamSchema.parse(params);

  const assignment = await getAssignment(context, id);
  return ok(assignment, undefined, { requestId: context.requestId });
});
