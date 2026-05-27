import { z } from 'zod';

export const marketplaceDiscoveryQuerySchema = z.object({
  city: z.string().trim().max(120).optional(),
  countryCode: z.string().length(2).optional(),
  skillName: z.string().trim().max(120).optional(),
  minRate: z.coerce.number().positive().optional(),
  sort: z.enum(['newest', 'rate_desc', 'rate_asc', 'headcount_desc']).optional().default('newest'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type MarketplaceDiscoveryQuery = z.infer<typeof marketplaceDiscoveryQuerySchema>;
