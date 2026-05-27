import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { WithdrawalService } from '@/modules/payments/services/withdrawal.service';
import type { CreateWithdrawalInput, WithdrawalTransitionInput } from '@/modules/payments/schemas';

export async function requestWithdrawal(
  context: AuthenticatedServiceContext,
  crewUserId: string,
  input: CreateWithdrawalInput,
) {
  return new WithdrawalService(context).requestWithdrawal({
    crewUserId,
    paymentId: input.paymentId,
    payoutMethodId: input.payoutMethodId,
    amount: input.amount,
    currency: input.currency ?? 'USD',
    idempotencyKey: input.idempotencyKey,
    reason: input.reason,
    autoAdvance: input.autoAdvance,
  });
}

export async function getWithdrawal(context: AuthenticatedServiceContext, withdrawalId: string) {
  return new WithdrawalService(context).getWithdrawal(withdrawalId);
}

export async function listWithdrawalSources(context: AuthenticatedServiceContext, crewUserId: string) {
  return new WithdrawalService(context).listWithdrawalSources(crewUserId);
}

export async function listPayoutMethods(context: AuthenticatedServiceContext, crewUserId: string) {
  return new WithdrawalService(context).listPayoutMethods(crewUserId);
}

export async function cancelWithdrawal(
  context: AuthenticatedServiceContext,
  withdrawalId: string,
  input?: WithdrawalTransitionInput,
) {
  return new WithdrawalService(context).cancelWithdrawal(withdrawalId, {
    reason: input?.reason ?? 'Cancelled by crew',
    idempotencyKey: input?.idempotencyKey,
  });
}

export async function reviewWithdrawal(
  context: AuthenticatedServiceContext,
  withdrawalId: string,
  input?: WithdrawalTransitionInput,
) {
  return new WithdrawalService(context).reviewWithdrawal(withdrawalId, {
    reason: input?.reason ?? 'Withdrawal under review',
    idempotencyKey: input?.idempotencyKey,
  });
}

export async function approveWithdrawal(
  context: AuthenticatedServiceContext,
  withdrawalId: string,
  input?: WithdrawalTransitionInput,
) {
  return new WithdrawalService(context).approveWithdrawal(withdrawalId, {
    reason: input?.reason ?? 'Withdrawal approved',
    idempotencyKey: input?.idempotencyKey,
  });
}

export async function rejectWithdrawal(
  context: AuthenticatedServiceContext,
  withdrawalId: string,
  input?: WithdrawalTransitionInput,
) {
  return new WithdrawalService(context).rejectWithdrawal(withdrawalId, {
    reason: input?.reason ?? 'Withdrawal rejected',
    idempotencyKey: input?.idempotencyKey,
  });
}

export async function processWithdrawal(
  context: AuthenticatedServiceContext,
  withdrawalId: string,
  input?: WithdrawalTransitionInput,
) {
  return new WithdrawalService(context).processWithdrawal(withdrawalId, {
    reason: input?.reason ?? 'Withdrawal processing',
    idempotencyKey: input?.idempotencyKey,
  });
}

export async function markWithdrawalPaid(
  context: AuthenticatedServiceContext,
  withdrawalId: string,
  input?: WithdrawalTransitionInput,
) {
  return new WithdrawalService(context).markWithdrawalPaid(withdrawalId, {
    reason: input?.reason ?? 'Withdrawal paid',
    idempotencyKey: input?.idempotencyKey,
  });
}

export async function markWithdrawalFailed(
  context: AuthenticatedServiceContext,
  withdrawalId: string,
  input?: WithdrawalTransitionInput,
) {
  return new WithdrawalService(context).markWithdrawalFailed(withdrawalId, {
    reason: input?.reason ?? 'Withdrawal failed',
    idempotencyKey: input?.idempotencyKey,
  });
}
