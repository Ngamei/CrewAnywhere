import {
  createCrewProfile,
  getMyCrewProfile,
  updateMyCrewProfile,
} from '@/modules/profiles/actions/profile-actions';
import { createCrewProfileSchema, updateCrewProfileSchema } from '@/modules/profiles/schemas';
import { created, ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context) => {
  const profile = await getMyCrewProfile(context);
  return ok(profile, undefined, { requestId: context.requestId });
});

export const POST = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, createCrewProfileSchema);
  if (parsed.response) return parsed.response;

  const profile = await createCrewProfile(context, parsed.data);
  return created(profile, { requestId: context.requestId });
});

export const PATCH = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, updateCrewProfileSchema);
  if (parsed.response) return parsed.response;

  const profile = await updateMyCrewProfile(context, parsed.data);
  return ok(profile, undefined, { requestId: context.requestId });
});
