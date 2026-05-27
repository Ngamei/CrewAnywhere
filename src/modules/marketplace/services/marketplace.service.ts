import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { assertCrewUser } from '@/shared/auth/guards';
import { CrewProfileRepository } from '@/modules/profiles/repositories/crew-profile.repository';
import { createProfileRepositoryClients } from '@/modules/profiles/repositories/profile-repository-clients';
import { MarketplaceRepository } from '@/modules/marketplace/repositories/marketplace.repository';
import type { MarketplaceDiscoveryResultDto, MarketplaceJobFilters } from '@/modules/marketplace/types';
import type { JobRecord, JobSkillRecord } from '@/modules/jobs/types/job-records';

export class MarketplaceService extends AuthenticatedBaseService {
  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  async discoverJobs(filters: MarketplaceJobFilters): Promise<MarketplaceDiscoveryResultDto> {
    const repo = new MarketplaceRepository(this.context.supabase);
    const result = await repo.discoverOpenJobs(filters);

    const events = result.events ?? [];
    const companies = result.companies ?? [];
    const skills = result.skills ?? [];
    const gates = result.marketplaceGates ?? { openEvents: new Set<string>(), readyCompanies: new Set<string>() };

    const eventMap = new Map(events.map((e) => [e.id, e]));
    const companyMap = new Map(companies.map((c) => [c.id, c]));
    const skillsByJob = new Map<string, typeof skills>();

    for (const skill of skills) {
      const list = skillsByJob.get(skill.job_id) ?? [];
      list.push(skill);
      skillsByJob.set(skill.job_id, list);
    }

    const items = result.jobs.map((job) => {
      const event = eventMap.get(job.event_id);
      const company = companyMap.get(job.company_profile_id);
      const marketplaceVisible =
        gates.openEvents.has(job.event_id) && gates.readyCompanies.has(job.company_profile_id);

      return {
        ...(job as JobRecord),
        skills: (skillsByJob.get(job.id) ?? []) as JobSkillRecord[],
        eventTitle: event?.title ?? null,
        eventStartsAt: event?.starts_at ?? null,
        eventEndsAt: event?.ends_at ?? null,
        companyName: company?.company_name ?? null,
        marketplaceVisible,
      };
    });

    const visibleItems = items.filter((i) => i.marketplaceVisible);

    return {
      items: visibleItems,
      total: visibleItems.length,
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    };
  }

  async getCrewStaffingAvailability() {
    const crewUser = assertCrewUser(this.requirePlatformIdentity());
    const profileRepo = new CrewProfileRepository(
      createProfileRepositoryClients(this.context.supabase),
    );
    const profile = await profileRepo.findByCrewUserId(crewUser.id);
    const openJobsVisible = await new MarketplaceRepository(this.context.supabase).countVisibleOpenJobs();

    return {
      crewUserId: crewUser.id,
      marketplaceReady: profile?.marketplace_ready ?? false,
      profilePublished: profile?.profile_published ?? false,
      openJobsVisible,
    };
  }
}
