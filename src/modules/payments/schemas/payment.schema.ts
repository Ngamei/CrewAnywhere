import { z } from 'zod';
import { paymentStatusEnum } from '@/shared/state/enums/payment-status';

export const crewUserIdParamSchema = z.object({
  crewUserId: z.string().uuid(),
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listPaymentsQuerySchema = z.object({
  companyProfileId: z.string().uuid().optional(),
  crewUserId: z.string().uuid().optional(),
  status: paymentStatusEnum.schema.optional(),
});

export const walletActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

export const assignmentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const paymentTransitionSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  providerReference: z.string().trim().min(1).max(256).optional(),
});

export const paymentReleaseSchema = paymentTransitionSchema.extend({
  shiftCompleted: z.boolean().optional(),
  attendanceValidated: z.boolean().optional(),
});

export const paymentRefundSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export const payoutPreparationSchema = z.object({
  crewUserId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().length(3).default('USD'),
});

export type PaymentTransitionInput = z.infer<typeof paymentTransitionSchema>;
export type PaymentReleaseInput = z.infer<typeof paymentReleaseSchema>;
export type PaymentRefundInput = z.infer<typeof paymentRefundSchema>;
export type PayoutPreparationInput = z.infer<typeof payoutPreparationSchema>;
