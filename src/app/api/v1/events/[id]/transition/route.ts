import { transitionEventStatus } from '@/modules/events/actions/event-actions';
import { eventIdParamSchema, transitionEventStatusSchema } from '@/modules/events/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = eventIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, transitionEventStatusSchema);
  if (parsed.response) return parsed.response;

  const event = await transitionEventStatus(context, id, parsed.data);
  return ok(event, undefined, { requestId: context.requestId });
});
