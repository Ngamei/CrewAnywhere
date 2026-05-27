import { getPlatformSession } from '@/backend/auth/session';
import { ok } from '@/shared/api/responses';
import { toPlatformSessionPayload } from '@/shared/auth/types';

export async function GET() {
  const session = await getPlatformSession();

  if (!session) {
    return ok({ authenticated: false as const });
  }

  return ok(toPlatformSessionPayload(session));
}
