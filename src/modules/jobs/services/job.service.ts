import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { AppError, NotFoundError } from '@/shared/api/errors';
import { assertBusinessUser } from '@/shared/auth/guards';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import { canTransitionJobLifecycle, getAllowedJobTransitions } from '@/shared/state/lifecycles';
import { EventRepository } from '@/modules/events/repositories';
import { assertEventCompanyAccess, assertEventRecordAccess } from '@/modules/events/hooks';
import { publishStaffingDomainEvent } from '@/modules/events/services/domain-event-publisher';
import { assertJobRecordAccess, evaluateJobPublishingReadiness } from '@/modules/jobs/hooks';
import { JobRepository } from '@/modules/jobs/repositories';
import type {
  CreateJobInput,
  TransitionJobStatusInput,
  UpdateJobInput,
} from '@/modules/jobs/schemas';
import type { JobDto, JobListItemDto } from '@/modules/jobs/types';
import type { JobPublishingReadiness } from '@/modules/jobs/types/job-workflow';

export class JobService extends AuthenticatedBaseService {
  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getJobRepository() {
    return new JobRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getEventRepository() {
    return new EventRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private async loadEventChain(eventId: string, companyProfileId: string) {
    const event = await this.getEventRepository().findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found.');
    }

    if (event.company_profile_id !== companyProfileId) {
      throw new AppError('INVALID_CHAIN', 'Event does not belong to the company profile.', 422);
    }

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformIdentity(),
      companyProfileId,
    );

    assertEventRecordAccess(this.requirePlatformIdentity(), event, company.owner_business_user_id);

    return { event, ownerBusinessUserId: company.owner_business_user_id };
  }

  private async toDto(job: NonNullable<Awaited<ReturnType<JobRepository['findById']>>>): Promise<JobDto> {
    const jobRepo = this.getJobRepository();
    const event = await this.getEventRepository().findById(job.event_id);

    if (!event) {
      throw new NotFoundError('Parent event not found.');
    }

    const skills = await jobRepo.listSkills(job.id);
    const readiness = evaluateJobPublishingReadiness(job, skills, event);

    return {
      ...job,
      skills,
      readiness,
      lifecycle: {
        status: job.status,
        allowedTransitions: getAllowedJobTransitions(job.status),
      },
    };
  }

  async listJobsByEvent(eventId: string): Promise<JobListItemDto[]> {
    const event = await this.getEventRepository().findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found.');
    }

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformIdentity(),
      event.company_profile_id,
    );
    assertEventRecordAccess(this.requirePlatformIdentity(), event, company.owner_business_user_id);

    const jobs = await this.getJobRepository().listByEvent(eventId);
    const jobRepo = this.getJobRepository();

    return Promise.all(
      jobs.map(async (job) => {
        const skills = await jobRepo.listSkills(job.id);
        return {
          id: job.id,
          event_id: job.event_id,
          company_profile_id: job.company_profile_id,
          title: job.title,
          status: job.status,
          headcount: job.headcount,
          rate_amount: job.rate_amount,
          updated_at: job.updated_at,
          requiredSkillCount: skills.filter((s) => s.required).length,
        };
      }),
    );
  }

  async getJob(jobId: string): Promise<JobDto> {
    const job = await this.getJobRepository().findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found.');
    }

    const event = await this.getEventRepository().findById(job.event_id);
    if (!event) {
      throw new NotFoundError('Parent event not found.');
    }

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformIdentity(),
      job.company_profile_id,
    );

    assertJobRecordAccess(
      this.requirePlatformIdentity(),
      job,
      event,
      company.owner_business_user_id,
    );

    return this.toDto(job);
  }

  async createJob(input: CreateJobInput): Promise<JobDto> {
    const { identity } = this.requirePlatformSession();
    const businessUser = assertBusinessUser(identity);

    const { event } = await this.loadEventChain(input.eventId, input.companyProfileId);

    if (event.status === 'cancelled' || event.status === 'closed') {
      throw new AppError('EVENT_NOT_OPEN', 'Cannot add jobs to a closed or cancelled event.', 422);
    }

    const job = await this.getJobRepository().create(businessUser.id, input);

    publishStaffingDomainEvent(
      'jobs.job_created',
      job.id,
      { eventId: job.event_id, companyProfileId: job.company_profile_id, status: job.status },
      this.context.requestId,
    );

    return this.toDto(job);
  }

  async updateJob(jobId: string, input: UpdateJobInput): Promise<JobDto> {
    const jobRepo = this.getJobRepository();
    const existing = await jobRepo.findById(jobId);

    if (!existing) {
      throw new NotFoundError('Job not found.');
    }

    const event = await this.getEventRepository().findById(existing.event_id);
    if (!event) {
      throw new NotFoundError('Parent event not found.');
    }

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformIdentity(),
      existing.company_profile_id,
    );

    assertJobRecordAccess(
      this.requirePlatformIdentity(),
      existing,
      event,
      company.owner_business_user_id,
    );

    const job = await jobRepo.update(jobId, input);

    publishStaffingDomainEvent(
      'jobs.job_updated',
      job.id,
      { status: job.status },
      this.context.requestId,
    );

    return this.toDto(job);
  }

  async transitionJobStatus(jobId: string, input: TransitionJobStatusInput): Promise<JobDto> {
    const jobRepo = this.getJobRepository();
    const existing = await jobRepo.findById(jobId);

    if (!existing) {
      throw new NotFoundError('Job not found.');
    }

    const event = await this.getEventRepository().findById(existing.event_id);
    if (!event) {
      throw new NotFoundError('Parent event not found.');
    }

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformIdentity(),
      existing.company_profile_id,
    );

    assertJobRecordAccess(
      this.requirePlatformIdentity(),
      existing,
      event,
      company.owner_business_user_id,
    );

    if (!canTransitionJobLifecycle(existing.status, input.toStatus)) {
      throw new AppError(
        'INVALID_TRANSITION',
        `Cannot transition job from ${existing.status} to ${input.toStatus}.`,
        422,
      );
    }

    if (input.toStatus === 'open') {
      const skills = await jobRepo.listSkills(jobId);
      const readiness = evaluateJobPublishingReadiness(existing, skills, event);
      if (!readiness.publishReady) {
        throw new AppError(
          'JOB_NOT_READY',
          'Job does not meet publishing requirements.',
          422,
          readiness,
        );
      }
    }

    const job = await jobRepo.transitionStatus(jobId, input.toStatus);

    if (input.toStatus === 'open') {
      publishStaffingDomainEvent(
        'jobs.job_opened',
        job.id,
        { eventId: job.event_id, idempotencyKey: input.idempotencyKey },
        this.context.requestId,
      );
    } else {
      publishStaffingDomainEvent(
        'jobs.job_status_changed',
        job.id,
        { fromStatus: existing.status, toStatus: input.toStatus, idempotencyKey: input.idempotencyKey },
        this.context.requestId,
      );
    }

    return this.toDto(job);
  }

  async getJobReadiness(jobId: string): Promise<JobPublishingReadiness> {
    const dto = await this.getJob(jobId);
    return dto.readiness;
  }
}
