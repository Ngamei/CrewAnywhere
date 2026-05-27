import { BaseRepository } from '@/backend/repositories/base-repository';
import type { DomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { JobStatus } from '@/shared/state/enums/job-status';
import type { JobRecord, JobSkillRecord } from '@/modules/jobs/types/job-records';
import type { CreateJobInput, JobSkillRequirementInput } from '@/modules/jobs/schemas';
import type { UpdateJobInput } from '@/modules/jobs/schemas/job.schema';

const JOB_COLUMNS =
  'id, event_id, company_profile_id, created_by_business_user_id, title, description, headcount, rate_amount, rate_currency, status, created_at, updated_at, deleted_at';

const SKILL_COLUMNS =
  'id, job_id, skill_name, skill_category, required, sort_order, created_at, updated_at, deleted_at';

export class JobRepository extends BaseRepository {
  constructor(private readonly clients: DomainRepositoryClients) {
    super(clients.read);
  }

  async findById(id: string): Promise<JobRecord | null> {
    const { data, error } = await this.clients.read
      .from('jobs')
      .select(JOB_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as JobRecord | null;
  }

  async listByEvent(eventId: string, status?: JobStatus): Promise<JobRecord[]> {
    let query = this.clients.read
      .from('jobs')
      .select(JOB_COLUMNS)
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as JobRecord[];
  }

  async listByCompany(companyProfileId: string, status?: JobStatus): Promise<JobRecord[]> {
    let query = this.clients.read
      .from('jobs')
      .select(JOB_COLUMNS)
      .eq('company_profile_id', companyProfileId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as JobRecord[];
  }

  async listSkills(jobId: string): Promise<JobSkillRecord[]> {
    const { data, error } = await this.clients.read
      .from('job_skills')
      .select(SKILL_COLUMNS)
      .eq('job_id', jobId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data ?? []) as JobSkillRecord[];
  }

  async create(businessUserId: string, input: CreateJobInput): Promise<JobRecord> {
    const { data, error } = await this.clients.write
      .from('jobs')
      .insert({
        event_id: input.eventId,
        company_profile_id: input.companyProfileId,
        created_by_business_user_id: businessUserId,
        title: input.title,
        description: input.description ?? null,
        headcount: input.headcount ?? 1,
        rate_amount: input.rateAmount ?? null,
        rate_currency: input.rateCurrency ?? 'USD',
        status: 'draft',
      })
      .select(JOB_COLUMNS)
      .single();

    if (error) throw error;
    const job = data as JobRecord;

    if (input.skills?.length) {
      await this.insertSkills(job.id, input.skills);
    }

    return job;
  }

  async insertSkills(jobId: string, skills: JobSkillRequirementInput[]): Promise<void> {
    const rows = skills.map((skill) => ({
      job_id: jobId,
      skill_name: skill.skillName,
      skill_category: skill.skillCategory ?? null,
      required: skill.required ?? true,
      sort_order: skill.sortOrder ?? 0,
    }));

    const { error } = await this.clients.write.from('job_skills').insert(rows);
    if (error) throw error;
  }

  async update(jobId: string, input: UpdateJobInput): Promise<JobRecord> {
    const patch: Record<string, unknown> = {};

    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.headcount !== undefined) patch.headcount = input.headcount;
    if (input.rateAmount !== undefined) patch.rate_amount = input.rateAmount;
    if (input.rateCurrency !== undefined) patch.rate_currency = input.rateCurrency;

    const { data, error } = await this.clients.write
      .from('jobs')
      .update(patch)
      .eq('id', jobId)
      .is('deleted_at', null)
      .select(JOB_COLUMNS)
      .single();

    if (error) throw error;
    return data as JobRecord;
  }

  async transitionStatus(jobId: string, toStatus: JobStatus): Promise<JobRecord> {
    const { data, error } = await this.clients.write
      .from('jobs')
      .update({ status: toStatus })
      .eq('id', jobId)
      .is('deleted_at', null)
      .select(JOB_COLUMNS)
      .single();

    if (error) throw error;
    return data as JobRecord;
  }
}
