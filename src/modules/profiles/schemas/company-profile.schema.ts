import { z } from 'zod';
import { companyStatusEnum } from '@/shared/state/enums/company-status';

const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be ISO 3166-1 alpha-2.')
  .transform((v) => v.toUpperCase());

const optionalUrlSchema = z
  .string()
  .url('Must be a valid URL.')
  .max(2048)
  .optional()
  .or(z.literal('').transform(() => undefined));

export const createCompanyProfileSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required.').max(200),
  legalName: z.string().trim().max(200).optional(),
  registrationNumber: z.string().trim().max(100).optional(),
  websiteUrl: optionalUrlSchema,
  description: z.string().trim().max(5000).optional(),
  countryCode: countryCodeSchema.optional(),
});

export const updateCompanyProfileSchema = createCompanyProfileSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const updateCompanyFinanceSchema = z
  .object({
    billingEmail: z.string().email('Invalid billing email.').optional(),
    taxIdentifier: z.string().trim().max(100).optional(),
    taxCountryCode: countryCodeSchema.optional(),
    defaultCurrency: z
      .string()
      .length(3, 'Currency must be ISO 4217.')
      .transform((v) => v.toUpperCase())
      .optional(),
    paymentSetupCompleted: z.boolean().optional(),
    taxSetupCompleted: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const companyProfileIdParamSchema = z.object({
  id: z.string().uuid('Invalid company profile id.'),
});

export const companyStatusSchema = companyStatusEnum.schema;

export type CreateCompanyProfileInput = z.infer<typeof createCompanyProfileSchema>;
export type UpdateCompanyProfileInput = z.infer<typeof updateCompanyProfileSchema>;
export type UpdateCompanyFinanceInput = z.infer<typeof updateCompanyFinanceSchema>;
