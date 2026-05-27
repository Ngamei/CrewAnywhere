import { z } from 'zod';
import { businessRoleEnum } from '@/shared/auth/enums';

export const updateBusinessMembershipSchema = z
  .object({
    firstName: z.string().trim().max(120).optional(),
    lastName: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(40).optional(),
    role: businessRoleEnum.schema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export type UpdateBusinessMembershipInput = z.infer<typeof updateBusinessMembershipSchema>;
