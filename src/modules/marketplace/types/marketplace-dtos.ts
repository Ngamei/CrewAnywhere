import type { JobRecord, JobSkillRecord } from '@/modules/jobs/types/job-records';

export type MarketplaceJobSort = 'newest' | 'rate_desc' | 'rate_asc' | 'headcount_desc';

export type MarketplaceJobFilters = {
  city?: string;
  countryCode?: string;
  skillName?: string;
  minRate?: number;
  sort?: MarketplaceJobSort;
  limit?: number;
  offset?: number;
};

export type MarketplaceJobListingDto = JobRecord & {
  skills: JobSkillRecord[];
  eventTitle: string | null;
  eventStartsAt: string | null;
  eventEndsAt: string | null;
  companyName: string | null;
  marketplaceVisible: boolean;
};

export type MarketplaceDiscoveryResultDto = {
  items: MarketplaceJobListingDto[];
  total: number;
  limit: number;
  offset: number;
};

export type StaffingAvailabilityDto = {
  crewUserId: string;
  marketplaceReady: boolean;
  profilePublished: boolean;
  openJobsVisible: number;
};
