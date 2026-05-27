import { listOwnedCompanyProfiles, createCompanyProfile } from '@/modules/profiles/actions/profile-actions';
import { createCompanyProfileSchema } from '@/modules/profiles/schemas';
import { created, ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context) => {
  const profiles = await listOwnedCompanyProfiles(context);
  return ok(profiles, undefined, { requestId: context.requestId });
});

export const POST = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, createCompanyProfileSchema);
  if (parsed.response) return parsed.response;

  const profile = await createCompanyProfile(context, parsed.data);
  return created(profile, { requestId: context.requestId });
});
