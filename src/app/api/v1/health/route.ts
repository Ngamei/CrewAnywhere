import { ok } from '@/shared/api/responses';

export function GET() {
  return ok({
    service: 'crewanywhere-api',
    status: 'ok',
    version: 'v1',
  });
}
