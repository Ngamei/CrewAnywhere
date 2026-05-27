import { z } from 'zod';
import { eventStatusEnum } from '@/shared/state/enums/event-status';

const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be ISO 3166-1 alpha-2.')
  .transform((v) => v.toUpperCase());

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const createEventSchema = z
  .object({
    companyProfileId: z.string().uuid('Invalid company profile id.'),
    title: z.string().trim().min(1, 'Title is required.').max(200),
    description: z.string().trim().max(10000).optional(),
    venueName: z.string().trim().max(200).optional(),
    addressLine: z.string().trim().max(300).optional(),
    city: z.string().trim().max(120).optional(),
    countryCode: countryCodeSchema.optional(),
    startsAt: isoDateTimeSchema.optional(),
    endsAt: isoDateTimeSchema.optional(),
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) return true;
      return data.endsAt >= data.startsAt;
    },
    { message: 'End time must be on or after start time.', path: ['endsAt'] },
  );

export const updateEventSchema = createEventSchema
  .omit({ companyProfileId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const transitionEventStatusSchema = z.object({
  toStatus: eventStatusEnum.schema,
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const eventIdParamSchema = z.object({
  id: z.string().uuid('Invalid event id.'),
});

export const listEventsQuerySchema = z.object({
  companyProfileId: z.string().uuid().optional(),
  status: eventStatusEnum.schema.optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type TransitionEventStatusInput = z.infer<typeof transitionEventStatusSchema>;
