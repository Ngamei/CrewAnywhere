import { getEventReadiness } from '@/modules/events/actions/event-actions';
import { eventIdParamSchema } from '@/modules/events/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = eventIdParamSchema.parse(params);

  const readiness = await getEventReadiness(context, id);
  return ok(readiness, undefined, { requestId: context.requestId });
});
