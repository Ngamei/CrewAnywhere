import type { ProposalStatus } from '@/shared/state/enums/proposal-status';

/** Row shape for `public.proposals`. */
export type ProposalRecord = {
  id: string;
  job_id: string;
  event_id: string;
  company_profile_id: string;
  crew_user_id: string;
  status: ProposalStatus;
  status_version: number;
  cover_note: string | null;
  submitted_at: string;
  hired_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.proposal_terms`. */
export type ProposalTermsRecord = {
  id: string;
  proposal_id: string;
  rate_amount: number | null;
  rate_currency: string;
  starts_at: string | null;
  ends_at: string | null;
  terms: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
