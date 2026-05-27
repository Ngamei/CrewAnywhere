import { processWithdrawal } from '@/modules/payments/actions';
import { withdrawalIdParamSchema, withdrawalTransitionSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = withdrawalIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, withdrawalTransitionSchema.partial());
  if (parsed.response) return parsed.response;

  const withdrawal = await processWithdrawal(context, id, parsed.data);
  return ok(withdrawal, undefined, { requestId: context.requestId });
});
