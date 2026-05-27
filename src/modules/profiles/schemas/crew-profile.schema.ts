import { z } from 'zod';

const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be ISO 3166-1 alpha-2.')
  .transform((v) => v.toUpperCase());

const currencySchema = z
  .string()
  .length(3, 'Currency must be ISO 4217.')
  .transform((v) => v.toUpperCase());

export const createCrewProfileSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required.').max(120),
  legalName: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  countryCode: countryCodeSchema.optional(),
  introduction: z.string().trim().max(5000).optional(),
  profileImageUrl: z.string().url().max(2048).optional(),
  hourlyRateAmount: z.number().positive('Hourly rate must be positive.').optional(),
  hourlyRateCurrency: currencySchema.optional(),
});

export const updateCrewProfileSchema = createCrewProfileSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const upsertCrewSkillSchema = z.object({
  skillName: z.string().trim().min(1, 'Skill name is required.').max(120),
  skillCategory: z.string().trim().max(80).optional(),
});

export const upsertCrewExperienceSchema = z
  .object({
    companyName: z.string().trim().max(200).optional(),
    roleTitle: z.string().trim().min(1, 'Role title is required.').max(200),
    description: z.string().trim().max(5000).optional(),
    startsOn: z.string().date().optional(),
    endsOn: z.string().date().optional(),
  })
  .refine(
    (data) => {
      if (!data.startsOn || !data.endsOn) return true;
      return data.endsOn >= data.startsOn;
    },
    { message: 'End date must be on or after start date.', path: ['endsOn'] },
  );

export const crewResourceIdParamSchema = z.object({
  id: z.string().uuid('Invalid resource id.'),
});

export type CreateCrewProfileInput = z.infer<typeof createCrewProfileSchema>;
export type UpdateCrewProfileInput = z.infer<typeof updateCrewProfileSchema>;
export type UpsertCrewSkillInput = z.infer<typeof upsertCrewSkillSchema>;
export type UpsertCrewExperienceInput = z.infer<typeof upsertCrewExperienceSchema>;
