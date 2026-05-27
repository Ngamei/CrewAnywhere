import { removeCrewSkill } from '@/modules/profiles/actions/profile-actions';
import { crewResourceIdParamSchema } from '@/modules/profiles/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const DELETE = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = crewResourceIdParamSchema.parse(params);

  await removeCrewSkill(context, id);
  return ok({ deleted: true }, undefined, { requestId: context.requestId });
});
