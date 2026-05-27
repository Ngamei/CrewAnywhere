import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { PaymentReadService, PaymentService } from '@/modules/payments/services';
import type {
  PaymentRefundInput,
  PaymentReleaseInput,
  PaymentTransitionInput,
  PayoutPreparationInput,
} from '@/modules/payments/schemas';

export async function createPaymentForAssignment(
  context: AuthenticatedServiceContext,
  assignmentId: string,
) {
  return new PaymentService(context).createPaymentForAssignment(assignmentId);
}

export async function getPayment(context: AuthenticatedServiceContext, paymentId: string) {
  return new PaymentService(context).getPayment(paymentId);
}

export async function getPaymentByAssignment(
  context: AuthenticatedServiceContext,
  assignmentId: string,
) {
  return new PaymentService(context).getPaymentByAssignment(assignmentId);
}

export async function getPaymentTimeline(context: AuthenticatedServiceContext, paymentId: string) {
  return new PaymentReadService(context).getPaymentTimeline(paymentId);
}

export async function authorizePayment(
  context: AuthenticatedServiceContext,
  paymentId: string,
  input?: PaymentTransitionInput,
) {
  return new PaymentService(context).authorizePayment(paymentId, input);
}

export async function fundEscrow(
  context: AuthenticatedServiceContext,
  paymentId: string,
  input?: PaymentTransitionInput,
) {
  return new PaymentService(context).fundEscrow(paymentId, input);
}

export async function releasePayment(
  context: AuthenticatedServiceContext,
  paymentId: string,
  input?: PaymentReleaseInput,
) {
  return new PaymentService(context).releasePayment(paymentId, input);
}

export async function createRefund(
  context: AuthenticatedServiceContext,
  paymentId: string,
  input?: PaymentRefundInput,
) {
  return new PaymentService(context).createRefund(paymentId, input);
}

export async function preparePayout(
  context: AuthenticatedServiceContext,
  input: PayoutPreparationInput,
) {
  return new PaymentService(context).preparePayout(
    input.crewUserId,
    input.amount,
    input.currency ?? 'USD',
  );
}

export async function orchestrateReleaseAfterShiftCompleted(
  context: AuthenticatedServiceContext,
  assignmentId: string,
  shiftId: string,
  input?: PaymentTransitionInput,
) {
  return new PaymentService(context).orchestrateReleaseAfterShiftCompleted(
    assignmentId,
    shiftId,
    input,
  );
}

export async function listPayments(
  context: AuthenticatedServiceContext,
  filters: { companyProfileId?: string; crewUserId?: string; status?: string } = {},
) {
  return new PaymentReadService(context).listPayments(filters);
}

export async function getPaymentWithWithdrawal(
  context: AuthenticatedServiceContext,
  paymentId: string,
) {
  return new PaymentReadService(context).getPaymentWithWithdrawal(paymentId);
}

export async function getPaymentEscrow(context: AuthenticatedServiceContext, paymentId: string) {
  return new PaymentReadService(context).getEscrowReadModel(paymentId);
}

export async function getPaymentEscrowTimeline(context: AuthenticatedServiceContext, paymentId: string) {
  return new PaymentReadService(context).getEscrowTimeline(paymentId);
}

export async function getPaymentLedgerHistory(context: AuthenticatedServiceContext, paymentId: string) {
  return new PaymentReadService(context).getLedgerHistory(paymentId);
}
