import { addCrewSkill } from '@/modules/profiles/actions/profile-actions';
import { upsertCrewSkillSchema } from '@/modules/profiles/schemas';
import { created } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, upsertCrewSkillSchema);
  if (parsed.response) return parsed.response;

  const skill = await addCrewSkill(context, parsed.data);
  return created(skill, { requestId: context.requestId });
});
