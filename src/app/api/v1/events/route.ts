import { createEvent, listCompanyEvents } from '@/modules/events/actions/event-actions';
import { createEventSchema, listEventsQuerySchema } from '@/modules/events/schemas';
import { created, ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (request, context) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = listEventsQuerySchema.parse(params);

  if (!query.companyProfileId) {
    return ok([], undefined, { requestId: context.requestId });
  }

  const events = await listCompanyEvents(context, query.companyProfileId, query.status);
  return ok(events, undefined, { requestId: context.requestId });
});

export const POST = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, createEventSchema);
  if (parsed.response) return parsed.response;

  const event = await createEvent(context, parsed.data);
  return created(event, { requestId: context.requestId });
});
