import { BaseRepository } from '@/backend/repositories/base-repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MarketplaceJobFilters } from '@/modules/marketplace/types';

const JOB_COLUMNS =
  'id, event_id, company_profile_id, created_by_business_user_id, title, description, headcount, rate_amount, rate_currency, status, created_at, updated_at, deleted_at';

export class MarketplaceRepository extends BaseRepository {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async discoverOpenJobs(filters: MarketplaceJobFilters) {
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    let query = this.supabase
      .from('jobs')
      .select(JOB_COLUMNS, { count: 'exact' })
      .in('status', ['open', 'reviewing'])
      .is('deleted_at', null);

    if (filters.minRate != null) {
      query = query.gte('rate_amount', filters.minRate);
    }

    const { data: jobs, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const jobRows = jobs ?? [];
    if (jobRows.length === 0) {
      return { jobs: [], total: count ?? 0 };
    }

    const jobIds = jobRows.map((j) => j.id);
    const eventIds = [...new Set(jobRows.map((j) => j.event_id))];
    const companyIds = [...new Set(jobRows.map((j) => j.company_profile_id))];

    const [{ data: skills }, { data: events }, { data: companies }] = await Promise.all([
      this.supabase
        .from('job_skills')
        .select(
          'id, job_id, skill_name, skill_category, required, sort_order, created_at, updated_at, deleted_at',
        )
        .in('job_id', jobIds)
        .is('deleted_at', null),
      this.supabase
        .from('events')
        .select('id, title, starts_at, ends_at, city, country_code, status')
        .in('id', eventIds)
        .is('deleted_at', null),
      this.supabase
        .from('company_profiles')
        .select('id, company_name, business_ready, verified_business')
        .in('id', companyIds)
        .is('deleted_at', null),
    ]);

    let filtered = jobRows;

    if (filters.city) {
      const eventMap = new Map((events ?? []).map((e) => [e.id, e]));
      filtered = filtered.filter((j) => {
        const event = eventMap.get(j.event_id);
        return event?.city?.toLowerCase() === filters.city!.toLowerCase();
      });
    }

    if (filters.countryCode) {
      const eventMap = new Map((events ?? []).map((e) => [e.id, e]));
      filtered = filtered.filter((j) => {
        const event = eventMap.get(j.event_id);
        return event?.country_code === filters.countryCode!.toUpperCase();
      });
    }

    if (filters.skillName) {
      const skillJobIds = new Set(
        (skills ?? [])
          .filter((s) => s.skill_name.toLowerCase().includes(filters.skillName!.toLowerCase()))
          .map((s) => s.job_id),
      );
      filtered = filtered.filter((j) => skillJobIds.has(j.id));
    }

    if (filters.sort === 'rate_desc') {
      filtered.sort((a, b) => (b.rate_amount ?? 0) - (a.rate_amount ?? 0));
    } else if (filters.sort === 'rate_asc') {
      filtered.sort((a, b) => (a.rate_amount ?? 0) - (b.rate_amount ?? 0));
    } else if (filters.sort === 'headcount_desc') {
      filtered.sort((a, b) => b.headcount - a.headcount);
    }

    const openEvents = new Set((events ?? []).filter((e) => e.status === 'open').map((e) => e.id));
    const readyCompanies = new Set(
      (companies ?? []).filter((c) => c.business_ready).map((c) => c.id),
    );

    return {
      jobs: filtered,
      skills: skills ?? [],
      events: events ?? [],
      companies: companies ?? [],
      total: count ?? filtered.length,
      marketplaceGates: { openEvents, readyCompanies },
    };
  }

  async countVisibleOpenJobs() {
    const { count, error } = await this.supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'reviewing'])
      .is('deleted_at', null);

    if (error) throw error;
    return count ?? 0;
  }
}
