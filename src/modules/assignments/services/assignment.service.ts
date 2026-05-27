import {
  WorkflowTransitionExecutor,
  buildIdempotencyKey,
  evaluateAssignmentGuards,
} from '@/backend/services/workflow';
import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { AppError, ConflictError, NotFoundError } from '@/shared/api/errors';
import {
  getTransitionedByAuthAccountId,
  resolveWorkflowTransitionSource,
} from '@/backend/auth/authorization';
import { assertBusinessUser } from '@/shared/auth/guards';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import { publishStaffingDomainEvent } from '@/modules/events/services/domain-event-publisher';
import { PaymentService } from '@/modules/payments/services';
import { assertEventCompanyAccess } from '@/modules/events/hooks';
import { ProposalRepository } from '@/modules/proposals/repositories';
import { assignmentWorkflowMachine } from '@/shared/state/workflows/assignment-lifecycle';
import { AssignmentRepository } from '@/modules/assignments/repositories';
import type { AssignmentDto } from '@/modules/assignments/types';

export class AssignmentService extends AuthenticatedBaseService {
  private readonly executor = new WorkflowTransitionExecutor();

  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getAssignmentRepository() {
    return new AssignmentRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getProposalRepository() {
    return new ProposalRepository(createDomainRepositoryClients(this.context.supabase));
  }

  /**
   * Creates an assignment from a hired proposal and records the initial workflow transition.
   */
  async generateFromProposal(proposalId: string): Promise<AssignmentDto> {
    const { identity } = this.requirePlatformSession();
    assertBusinessUser(identity);

    const proposal = await this.getProposalRepository().findById(proposalId);
    if (!proposal) throw new NotFoundError('Proposal not found.');

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      identity,
      proposal.company_profile_id,
    );

    if (proposal.status !== 'hired') {
      throw new AppError('PROPOSAL_NOT_HIRED', 'Proposal must be hired before generating assignment.', 422);
    }

    const assignmentRepo = this.getAssignmentRepository();
    const existing = await assignmentRepo.findByProposalId(proposalId);
    if (existing) {
      throw new ConflictError('Assignment already exists for this proposal.');
    }

    const terms = await this.getProposalRepository().findTerms(proposalId);

    const assignment = await assignmentRepo.insertFromProposal({
      proposalId: proposal.id,
      jobId: proposal.job_id,
      eventId: proposal.event_id,
      companyProfileId: proposal.company_profile_id,
      crewUserId: proposal.crew_user_id,
      scheduledStartAt: terms?.starts_at ?? undefined,
      scheduledEndAt: terms?.ends_at ?? undefined,
    });

    const guardResult = evaluateAssignmentGuards(['proposal_hired', 'payment_authorized'], {
      identity,
      proposal,
      ownerBusinessUserId: company.owner_business_user_id,
    });

    const transitionName = assignmentWorkflowMachine.getTransition(null, 'scheduled')!.name;

    const transition = await this.executor.execute({
      entityType: 'assignment',
      entityId: assignment.id,
      toStatus: 'scheduled',
      transitionReason: 'Assignment created from hired proposal',
      transitionedBy: getTransitionedByAuthAccountId(identity),
      transitionSource: resolveWorkflowTransitionSource(identity),
      guardResult,
      metadata: { requestId: this.context.requestId, proposalId, transitionName },
      idempotencyKey: buildIdempotencyKey({
        entityType: 'assignment',
        entityId: assignment.id,
        transitionName,
        requestId: this.context.requestId,
      }),
      correlationId: this.context.requestId,
      expectedFromStatus: null,
      expectedFromStatusVersion: null,
    });

    publishStaffingDomainEvent(
      'assignments.assignment_created',
      assignment.id,
      { proposalId, workflowEventId: transition.workflow_event_id },
      this.context.requestId,
    );

    try {
      await new PaymentService(this.context).createPaymentForAssignment(assignment.id);
    } catch (error) {
      if (!(error instanceof ConflictError)) {
        throw error;
      }
    }

    return { ...assignment, lastTransition: transition };
  }

  async getAssignment(assignmentId: string): Promise<AssignmentDto> {
    const assignment = await this.getAssignmentRepository().findById(assignmentId);
    if (!assignment) throw new NotFoundError('Assignment not found.');

    const events = await this.getAssignmentRepository().listWorkflowEvents(assignmentId);
    const last = events.length > 0 ? events[events.length - 1] : null;

    return { ...assignment, lastTransition: last as AssignmentDto['lastTransition'] };
  }

  async getAssignmentWorkflowTimeline(assignmentId: string) {
    await this.getAssignment(assignmentId);
    return this.getAssignmentRepository().listWorkflowEvents(assignmentId);
  }
}
