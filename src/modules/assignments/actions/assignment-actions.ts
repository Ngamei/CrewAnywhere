import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { AssignmentService } from '@/modules/assignments/services/assignment.service';

export async function generateAssignmentFromProposal(
  context: AuthenticatedServiceContext,
  proposalId: string,
) {
  return new AssignmentService(context).generateFromProposal(proposalId);
}

export async function getAssignment(context: AuthenticatedServiceContext, assignmentId: string) {
  return new AssignmentService(context).getAssignment(assignmentId);
}

export async function getAssignmentTimeline(
  context: AuthenticatedServiceContext,
  assignmentId: string,
) {
  return new AssignmentService(context).getAssignmentWorkflowTimeline(assignmentId);
}
