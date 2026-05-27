import { z } from 'zod';
import { jobStatusEnum } from '@/shared/state/enums/job-status';

const currencySchema = z
  .string()
  .length(3, 'Currency must be ISO 4217.')
  .transform((v) => v.toUpperCase());

export const jobSkillRequirementSchema = z.object({
  skillName: z.string().trim().min(1).max(120),
  skillCategory: z.string().trim().max(80).optional(),
  required: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const createJobSchema = z.object({
  eventId: z.string().uuid('Invalid event id.'),
  companyProfileId: z.string().uuid('Invalid company profile id.'),
  title: z.string().trim().min(1, 'Title is required.').max(200),
  description: z.string().trim().max(10000).optional(),
  headcount: z.number().int().min(1, 'Headcount must be at least 1.').optional().default(1),
  rateAmount: z.number().positive('Rate must be positive.').optional(),
  rateCurrency: currencySchema.optional(),
  skills: z.array(jobSkillRequirementSchema).max(50).optional(),
});

export const updateJobSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(10000).optional(),
    headcount: z.number().int().min(1).optional(),
    rateAmount: z.number().positive().nullable().optional(),
    rateCurrency: currencySchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const transitionJobStatusSchema = z.object({
  toStatus: jobStatusEnum.schema,
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const jobIdParamSchema = z.object({
  id: z.string().uuid('Invalid job id.'),
});

export const listJobsQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
  companyProfileId: z.string().uuid().optional(),
  status: jobStatusEnum.schema.optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type TransitionJobStatusInput = z.infer<typeof transitionJobStatusSchema>;
export type JobSkillRequirementInput = z.infer<typeof jobSkillRequirementSchema>;
