import type { WorkflowTransitionEventRecord } from '@/backend/services/workflow';
import type { ProposalRecord, ProposalTermsRecord } from './proposal-records';

export type ProposalDto = ProposalRecord & {
  terms: ProposalTermsRecord | null;
  lastTransition: WorkflowTransitionEventRecord | null;
};

export type ProposalListItemDto = Pick<
  ProposalRecord,
  'id' | 'job_id' | 'crew_user_id' | 'status' | 'submitted_at' | 'updated_at'
> & {
  coverNotePreview: string | null;
};

export type ProposalReviewItemDto = ProposalListItemDto & {
  displayName?: string | null;
};
