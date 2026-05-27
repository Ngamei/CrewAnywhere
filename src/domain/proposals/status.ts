export const PROPOSAL_STATUSES = [
  'applied',
  'offer_sent',
  'offer_accepted',
  'declined',
  'withdrawn',
  'hired',
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUS_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  applied: ['offer_sent', 'declined', 'withdrawn'],
  offer_sent: ['offer_accepted', 'declined', 'withdrawn'],
  offer_accepted: ['hired', 'withdrawn'],
  declined: [],
  withdrawn: [],
  hired: [],
};
