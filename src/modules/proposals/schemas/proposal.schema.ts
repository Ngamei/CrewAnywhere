import { z } from 'zod';
import { proposalStatusEnum } from '@/shared/state/enums/proposal-status';

export const submitProposalSchema = z.object({
  jobId: z.string().uuid(),
  coverNote: z.string().trim().max(5000).optional(),
});

export const proposalTransitionSchema = z.object({
  toStatus: proposalStatusEnum.schema,
  reason: z.string().trim().min(1).max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const sendOfferSchema = z.object({
  rateAmount: z.number().positive().optional(),
  rateCurrency: z.string().length(3).optional(),
  reason: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const proposalIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listProposalsQuerySchema = z.object({
  jobId: z.string().uuid().optional(),
  crewUserId: z.string().uuid().optional(),
  status: proposalStatusEnum.schema.optional(),
});

export type SubmitProposalInput = z.infer<typeof submitProposalSchema>;
export type ProposalTransitionInput = z.infer<typeof proposalTransitionSchema>;
export type SendOfferInput = z.infer<typeof sendOfferSchema>;
