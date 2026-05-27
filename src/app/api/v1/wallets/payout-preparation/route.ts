import { preparePayout } from '@/modules/payments/actions';
import { payoutPreparationSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context) => {
  const parsed = await parseJsonBody(request, payoutPreparationSchema);
  if (parsed.response) return parsed.response;

  const result = await preparePayout(context, parsed.data);
  return ok(result, undefined, { requestId: context.requestId });
});
