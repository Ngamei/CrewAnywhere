import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { MarketplaceService } from '@/modules/marketplace/services/marketplace.service';
import type { MarketplaceJobFilters } from '@/modules/marketplace/types';

export async function discoverMarketplaceJobs(
  context: AuthenticatedServiceContext,
  filters: MarketplaceJobFilters,
) {
  return new MarketplaceService(context).discoverJobs(filters);
}

export async function getCrewStaffingAvailability(context: AuthenticatedServiceContext) {
  return new MarketplaceService(context).getCrewStaffingAvailability();
}
