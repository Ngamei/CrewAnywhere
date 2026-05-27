import { getEvent, updateEvent } from '@/modules/events/actions/event-actions';
import { eventIdParamSchema, updateEventSchema } from '@/modules/events/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = eventIdParamSchema.parse(params);

  const event = await getEvent(context, id);
  return ok(event, undefined, { requestId: context.requestId });
});

export const PATCH = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = eventIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, updateEventSchema);
  if (parsed.response) return parsed.response;

  const event = await updateEvent(context, id, parsed.data);
  return ok(event, undefined, { requestId: context.requestId });
});
