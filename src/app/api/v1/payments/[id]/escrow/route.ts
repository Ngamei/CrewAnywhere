import { getPaymentEscrow, getPaymentEscrowTimeline } from '@/modules/payments/actions/payment-actions';
import { paymentIdParamSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = paymentIdParamSchema.parse(params);
  const url = new URL(request.url);

  if (url.searchParams.get('view') === 'timeline') {
    const timeline = await getPaymentEscrowTimeline(context, id);
    return ok(timeline, undefined, { requestId: context.requestId });
  }

  const escrow = await getPaymentEscrow(context, id);
  return ok(escrow, undefined, { requestId: context.requestId });
});
