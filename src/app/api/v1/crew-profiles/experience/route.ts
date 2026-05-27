import { addCrewExperience } from '@/modules/profiles/actions/profile-actions';
import { upsertCrewExperienceSchema } from '@/modules/profiles/schemas';
import { created } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, upsertCrewExperienceSchema);
  if (parsed.response) return parsed.response;

  const experience = await addCrewExperience(context, parsed.data);
  return created(experience, { requestId: context.requestId });
});
