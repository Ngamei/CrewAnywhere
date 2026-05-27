import {
  WorkflowTransitionExecutor,
  buildIdempotencyKey,
  evaluateProposalGuards,
} from '@/backend/services/workflow';
import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/api/errors';
import {
  getTransitionedByAuthAccountId,
  resolveWorkflowTransitionSource,
} from '@/backend/auth/authorization';
import { assertBusinessUser, assertCrewUser } from '@/shared/auth/guards';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import { publishStaffingDomainEvent } from '@/modules/events/services/domain-event-publisher';
import { JobRepository } from '@/modules/jobs/repositories';
import {
  CrewProfileRepository,
  createProfileRepositoryClients,
} from '@/modules/profiles/repositories';
import { assertEventCompanyAccess } from '@/modules/events/hooks';
import { proposalWorkflowMachine } from '@/shared/state/workflows/proposal-lifecycle';
import type { ProposalStatus } from '@/shared/state/enums/proposal-status';
import { ProposalRepository } from '@/modules/proposals/repositories';
import type { SendOfferInput, SubmitProposalInput } from '@/modules/proposals/schemas';
import type { ProposalDto, ProposalListItemDto } from '@/modules/proposals/types';
import type { WorkflowTransitionEventRecord } from '@/backend/services/workflow';
import type { ProposalRecord } from '@/modules/proposals/types/proposal-records';

export class ProposalService extends AuthenticatedBaseService {
  private readonly executor = new WorkflowTransitionExecutor();

  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getProposalRepository() {
    return new ProposalRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getJobRepository() {
    return new JobRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private async toDto(
    proposal: ProposalRecord,
    lastTransition: WorkflowTransitionEventRecord | null = null,
  ): Promise<ProposalDto> {
    const terms = await this.getProposalRepository().findTerms(proposal.id);
    return { ...proposal, terms, lastTransition };
  }

  private resolveTransitionName(from: ProposalStatus | null, to: ProposalStatus) {
    const transition = proposalWorkflowMachine.getTransition(from, to);
    if (!transition) {
      throw new AppError('INVALID_TRANSITION', `No workflow transition from ${from} to ${to}`, 422);
    }
    return transition.name;
  }

  private async runTransition(
    proposal: ProposalRecord,
    toStatus: ProposalStatus,
    guardKeys: readonly string[],
    reason: string,
    idempotencyKey?: string,
  ) {
    const { identity } = this.requirePlatformSession();
    const job = await this.getJobRepository().findById(proposal.job_id);
    if (!job) throw new NotFoundError('Job not found.');

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      identity,
      proposal.company_profile_id,
    );

    const crewProfileRepo = new CrewProfileRepository(
      createProfileRepositoryClients(this.context.supabase),
    );
    const crewProfile = await crewProfileRepo.findByCrewUserId(proposal.crew_user_id);

    const guardResult = evaluateProposalGuards(guardKeys, {
      identity,
      proposal,
      job,
      crewProfile,
      ownerBusinessUserId: company.owner_business_user_id,
    });

    const fromStatus = proposal.status;
    const transitionName = this.resolveTransitionName(fromStatus, toStatus);
    const key =
      idempotencyKey ??
      buildIdempotencyKey({
        entityType: 'proposal',
        entityId: proposal.id,
        transitionName,
        requestId: this.context.requestId,
      });

    const isInitial = fromStatus === toStatus && proposal.status_version === 0;

    const event = await this.executor.execute({
      entityType: 'proposal',
      entityId: proposal.id,
      toStatus,
      transitionReason: reason,
      transitionedBy: getTransitionedByAuthAccountId(identity),
      transitionSource: resolveWorkflowTransitionSource(identity),
      guardResult,
      metadata: { requestId: this.context.requestId, transitionName },
      idempotencyKey: key,
      correlationId: this.context.requestId,
      expectedFromStatus: isInitial ? null : fromStatus,
      expectedFromStatusVersion: isInitial ? null : proposal.status_version,
    });

    return event;
  }

  async submitProposal(input: SubmitProposalInput): Promise<ProposalDto> {
    const { identity } = this.requirePlatformSession();
    const crewUser = assertCrewUser(identity);

    const job = await this.getJobRepository().findById(input.jobId);
    if (!job) throw new NotFoundError('Job not found.');

    if (job.status !== 'open' && job.status !== 'reviewing') {
      throw new AppError('JOB_NOT_OPEN', 'Job is not open for proposals.', 422);
    }

    const repo = this.getProposalRepository();
    const existing = await repo.findByJobAndCrew(input.jobId, crewUser.id);
    if (existing) {
      throw new ConflictError('You have already submitted a proposal for this job.');
    }

    const proposal = await repo.insertProposal({
      jobId: job.id,
      eventId: job.event_id,
      companyProfileId: job.company_profile_id,
      crewUserId: crewUser.id,
      coverNote: input.coverNote,
    });

    const transition = await this.runTransition(
      proposal,
      'applied',
      ['job_open', 'crew_marketplace_ready'],
      'Crew submitted proposal',
    );

    publishStaffingDomainEvent(
      'proposals.proposal_created',
      proposal.id,
      { jobId: job.id, crewUserId: crewUser.id, workflowEventId: transition.workflow_event_id },
      this.context.requestId,
    );

    const refreshed = await repo.findById(proposal.id);
    if (!refreshed) throw new NotFoundError('Proposal not found after submission.');

    return this.toDto(refreshed, transition);
  }

  async listJobProposalsForBusiness(jobId: string): Promise<ProposalListItemDto[]> {
    const { identity } = this.requirePlatformSession();
    assertBusinessUser(identity);

    const job = await this.getJobRepository().findById(jobId);
    if (!job) throw new NotFoundError('Job not found.');

    await assertEventCompanyAccess(this.context.supabase, identity, job.company_profile_id);

    const proposals = await this.getProposalRepository().listByJob(jobId);
    return proposals.map((p) => ({
      id: p.id,
      job_id: p.job_id,
      crew_user_id: p.crew_user_id,
      status: p.status,
      submitted_at: p.submitted_at,
      updated_at: p.updated_at,
      coverNotePreview: p.cover_note?.slice(0, 120) ?? null,
    }));
  }

  async listMyProposals(): Promise<ProposalListItemDto[]> {
    const crewUser = assertCrewUser(this.requirePlatformIdentity());
    const proposals = await this.getProposalRepository().listByCrew(crewUser.id);
    return proposals.map((p) => ({
      id: p.id,
      job_id: p.job_id,
      crew_user_id: p.crew_user_id,
      status: p.status,
      submitted_at: p.submitted_at,
      updated_at: p.updated_at,
      coverNotePreview: p.cover_note?.slice(0, 120) ?? null,
    }));
  }

  async getProposal(proposalId: string): Promise<ProposalDto> {
    const proposal = await this.getProposalRepository().findById(proposalId);
    if (!proposal) throw new NotFoundError('Proposal not found.');

    await this.assertProposalReadAccess(proposal);
    const events = await this.getProposalRepository().listWorkflowEvents(proposalId);
    const last = events.length > 0 ? events[events.length - 1] : null;

    return this.toDto(proposal, last as WorkflowTransitionEventRecord | null);
  }

  async getProposalWorkflowTimeline(proposalId: string) {
    await this.getProposal(proposalId);
    return this.getProposalRepository().listWorkflowEvents(proposalId);
  }

  private async assertProposalReadAccess(proposal: ProposalRecord) {
    const { identity } = this.requirePlatformSession();

    if (identity.role === 'platform_admin') return;

    if (identity.crewUser?.id === proposal.crew_user_id) return;

    if (identity.businessUser) {
      await assertEventCompanyAccess(
        this.context.supabase,
        identity,
        proposal.company_profile_id,
      );
      return;
    }

    throw new ForbiddenError('You do not have access to this proposal.');
  }

  async sendOffer(proposalId: string, input: SendOfferInput): Promise<ProposalDto> {
    const proposal = await this.getProposalRepository().findById(proposalId);
    if (!proposal) throw new NotFoundError('Proposal not found.');

    assertBusinessUser(this.requirePlatformIdentity());
    await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformIdentity(),
      proposal.company_profile_id,
    );

    if (proposal.status !== 'applied') {
      throw new AppError('INVALID_STATE', 'Only applied proposals can receive offers.', 422);
    }

    if (input.rateAmount != null) {
      await this.getProposalRepository().upsertTerms(proposalId, {
        rateAmount: input.rateAmount,
        rateCurrency: input.rateCurrency,
      });
    }

    const transition = await this.runTransition(
      proposal,
      'offer_sent',
      ['business_owns_job', 'proposal_active'],
      input.reason ?? 'Business sent offer',
      input.idempotencyKey,
    );

    publishStaffingDomainEvent(
      'proposals.proposal_reviewed',
      proposalId,
      { toStatus: 'offer_sent', workflowEventId: transition.workflow_event_id },
      this.context.requestId,
    );

    const refreshed = await this.getProposalRepository().findById(proposalId);
    return this.toDto(refreshed!, transition);
  }

  async declineApplication(proposalId: string, reason?: string, idempotencyKey?: string) {
    return this.rejectProposal(proposalId, 'declined', 'decline_application', reason, idempotencyKey);
  }

  async declineOffer(proposalId: string, reason?: string, idempotencyKey?: string) {
    return this.rejectProposal(proposalId, 'declined', 'decline_offer', reason, idempotencyKey);
  }

  private async rejectProposal(
    proposalId: string,
    toStatus: 'declined',
    transitionName: 'decline_application' | 'decline_offer',
    reason?: string,
    idempotencyKey?: string,
  ) {
    const proposal = await this.getProposalRepository().findById(proposalId);
    if (!proposal) throw new NotFoundError('Proposal not found.');

    const { identity } = this.requirePlatformSession();
    const guardKeys =
      transitionName === 'decline_application'
        ? (['business_owns_job'] as const)
        : (['crew_owns_proposal'] as const);

    if (transitionName === 'decline_application') {
      assertBusinessUser(identity);
      await assertEventCompanyAccess(this.context.supabase, identity, proposal.company_profile_id);
    } else {
      assertCrewUser(identity);
      if (identity.crewUser!.id !== proposal.crew_user_id) {
        throw new ForbiddenError('Crew user does not own this proposal.');
      }
    }

    const transition = await this.runTransition(
      proposal,
      toStatus,
      guardKeys,
      reason ?? 'Proposal declined',
      idempotencyKey,
    );

    publishStaffingDomainEvent(
      'proposals.proposal_rejected',
      proposalId,
      { toStatus, workflowEventId: transition.workflow_event_id },
      this.context.requestId,
    );

    const refreshed = await this.getProposalRepository().findById(proposalId);
    return this.toDto(refreshed!, transition);
  }

  async acceptOffer(proposalId: string, reason?: string, idempotencyKey?: string) {
    const proposal = await this.getProposalRepository().findById(proposalId);
    if (!proposal) throw new NotFoundError('Proposal not found.');

    assertCrewUser(this.requirePlatformIdentity());
    if (this.requirePlatformIdentity().crewUser!.id !== proposal.crew_user_id) {
      throw new ForbiddenError('Crew user does not own this proposal.');
    }

    const transition = await this.runTransition(
      proposal,
      'offer_accepted',
      ['crew_owns_proposal', 'offer_valid'],
      reason ?? 'Crew accepted offer',
      idempotencyKey,
    );

    publishStaffingDomainEvent(
      'proposals.proposal_accepted',
      proposalId,
      { toStatus: 'offer_accepted', workflowEventId: transition.workflow_event_id },
      this.context.requestId,
    );

    const refreshed = await this.getProposalRepository().findById(proposalId);
    return this.toDto(refreshed!, transition);
  }

  async withdrawProposal(proposalId: string, reason?: string, idempotencyKey?: string) {
    const proposal = await this.getProposalRepository().findById(proposalId);
    if (!proposal) throw new NotFoundError('Proposal not found.');

    assertCrewUser(this.requirePlatformIdentity());
    if (this.requirePlatformIdentity().crewUser!.id !== proposal.crew_user_id) {
      throw new ForbiddenError('Crew user does not own this proposal.');
    }

    const toStatus: ProposalStatus = 'withdrawn';
    const guardKeys: readonly string[] = ['crew_owns_proposal'];
    const transitionReason = reason ?? 'Crew withdrew proposal';

    if (proposal.status !== 'applied' && proposal.status !== 'offer_sent' && proposal.status !== 'offer_accepted') {
      throw new AppError('INVALID_STATE', 'Proposal cannot be withdrawn in current state.', 422);
    }

    const transition = await this.runTransition(
      proposal,
      toStatus,
      guardKeys,
      transitionReason,
      idempotencyKey,
    );

    const refreshed = await this.getProposalRepository().findById(proposalId);
    return this.toDto(refreshed!, transition);
  }

  async confirmHire(proposalId: string, reason?: string, idempotencyKey?: string) {
    const proposal = await this.getProposalRepository().findById(proposalId);
    if (!proposal) throw new NotFoundError('Proposal not found.');

    assertBusinessUser(this.requirePlatformIdentity());
    await assertEventCompanyAccess(
      this.context.supabase,
      this.requirePlatformIdentity(),
      proposal.company_profile_id,
    );

    if (proposal.status !== 'offer_accepted') {
      throw new AppError('INVALID_STATE', 'Proposal must be offer_accepted to confirm hire.', 422);
    }

    const transition = await this.runTransition(
      proposal,
      'hired',
      ['business_owns_job', 'payment_authorized'],
      reason ?? 'Business confirmed hire',
      idempotencyKey,
    );

    await this.getProposalRepository().markHired(proposalId);

    publishStaffingDomainEvent(
      'proposals.proposal_hired',
      proposalId,
      { workflowEventId: transition.workflow_event_id },
      this.context.requestId,
    );

    const refreshed = await this.getProposalRepository().findById(proposalId);
    return this.toDto(refreshed!, transition);
  }
}
