import { listPayments } from '@/modules/payments/actions/payment-actions';
import { listPaymentsQuerySchema } from '@/modules/payments/schemas';
import { ok } from '@/shared/api/responses';
import { withAuth } from '@/shared/api/with-auth';

export const GET = withAuth(async (request, context) => {
  const url = new URL(request.url);
  const filters = listPaymentsQuerySchema.parse({
    companyProfileId: url.searchParams.get('companyProfileId') ?? undefined,
    crewUserId: url.searchParams.get('crewUserId') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
  });

  const payments = await listPayments(context, filters);
  return ok(payments, undefined, { requestId: context.requestId });
});
