import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { AssignmentService } from '@/modules/assignments/services/assignment.service';
import { ProposalService } from '@/modules/proposals/services/proposal.service';
import type { SendOfferInput, SubmitProposalInput } from '@/modules/proposals/schemas';

export async function submitProposal(context: AuthenticatedServiceContext, input: SubmitProposalInput) {
  return new ProposalService(context).submitProposal(input);
}

export async function listJobProposals(context: AuthenticatedServiceContext, jobId: string) {
  return new ProposalService(context).listJobProposalsForBusiness(jobId);
}

export async function listMyProposals(context: AuthenticatedServiceContext) {
  return new ProposalService(context).listMyProposals();
}

export async function getProposal(context: AuthenticatedServiceContext, proposalId: string) {
  return new ProposalService(context).getProposal(proposalId);
}

export async function getProposalTimeline(context: AuthenticatedServiceContext, proposalId: string) {
  return new ProposalService(context).getProposalWorkflowTimeline(proposalId);
}

export async function sendOffer(
  context: AuthenticatedServiceContext,
  proposalId: string,
  input: SendOfferInput,
) {
  return new ProposalService(context).sendOffer(proposalId, input);
}

export async function acceptOffer(
  context: AuthenticatedServiceContext,
  proposalId: string,
  reason?: string,
  idempotencyKey?: string,
) {
  return new ProposalService(context).acceptOffer(proposalId, reason, idempotencyKey);
}

export async function declineProposal(
  context: AuthenticatedServiceContext,
  proposalId: string,
  mode: 'application' | 'offer',
  reason?: string,
  idempotencyKey?: string,
) {
  const service = new ProposalService(context);
  return mode === 'application'
    ? service.declineApplication(proposalId, reason, idempotencyKey)
    : service.declineOffer(proposalId, reason, idempotencyKey);
}

export async function withdrawProposal(
  context: AuthenticatedServiceContext,
  proposalId: string,
  reason?: string,
  idempotencyKey?: string,
) {
  return new ProposalService(context).withdrawProposal(proposalId, reason, idempotencyKey);
}

export async function confirmHireAndAssign(
  context: AuthenticatedServiceContext,
  proposalId: string,
  reason?: string,
  idempotencyKey?: string,
) {
  const proposal = await new ProposalService(context).confirmHire(proposalId, reason, idempotencyKey);
  const assignment = await new AssignmentService(context).generateFromProposal(proposalId);
  return { proposal, assignment };
}
