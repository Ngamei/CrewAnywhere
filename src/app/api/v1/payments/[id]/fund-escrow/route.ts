import { fundEscrow } from '@/modules/payments/actions';
import { paymentIdParamSchema, paymentTransitionSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { parseJsonBody } from '@/shared/api/validation';
import { withAuth } from '@/shared/api/with-auth';

export const POST = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = paymentIdParamSchema.parse(params);

  const parsed = await parseJsonBody(request, paymentTransitionSchema.partial());
  if (parsed.response) return parsed.response;

  const payment = await fundEscrow(context, id, parsed.data);
  return ok(payment, undefined, { requestId: context.requestId });
});
