import {
  createPaymentForAssignment,
  getPaymentByAssignment,
} from '@/modules/payments/actions';
import { assignmentIdParamSchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = assignmentIdParamSchema.parse(params);
  const payment = await getPaymentByAssignment(context, id);
  return ok(payment, undefined, { requestId: context.requestId });
});

export const POST = withAuth(async (_request, context, routeContext) => {
  const params = await routeContext.params;
  const { id } = assignmentIdParamSchema.parse(params);
  const payment = await createPaymentForAssignment(context, id);
  return ok(payment, undefined, { requestId: context.requestId });
});
