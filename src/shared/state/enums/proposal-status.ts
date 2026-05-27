import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.proposal_status` */
export const proposalStatusEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.proposalStatus}`,
  values: [
    'applied',
    'offer_sent',
    'offer_accepted',
    'declined',
    'withdrawn',
    'hired',
  ] as const,
});

export const PROPOSAL_STATUSES = proposalStatusEnum.values;
export type ProposalStatus = PgEnumValue<typeof proposalStatusEnum>;
