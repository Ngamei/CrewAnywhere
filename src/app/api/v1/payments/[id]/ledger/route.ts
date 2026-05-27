import { getPaymentLedgerHistory } from '@/modules/payments/actions/payment-actions';
import { paymentIdParamSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = paymentIdParamSchema.parse(params);

  const history = await getPaymentLedgerHistory(context, id);
  return ok(history, undefined, { requestId: context.requestId });
});
