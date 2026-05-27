import { ForbiddenError } from '@/shared/api/errors';
import type { PlatformIdentity } from '@/shared/auth/types';

/** Ownership context carried on workflow entities (proposal → withdrawal chain). */
export type WorkflowOwnershipContext = {
  companyProfileId?: string | null;
  crewUserId?: string | null;
  businessUserId?: string | null;
  jobId?: string | null;
  eventId?: string | null;
};

export function assertCompanyOwnership(
  identity: PlatformIdentity,
  companyProfileId: string,
  ownerBusinessUserId: string,
) {
  const businessUser = identity.businessUser;

  if (!businessUser) {
    throw new ForbiddenError('Business user context is required for company ownership.');
  }

  if (identity.role === 'platform_admin') {
    return;
  }

  if (businessUser.id !== ownerBusinessUserId) {
    throw new ForbiddenError('You do not own this company profile.');
  }
}

export function assertCrewOwnership(identity: PlatformIdentity, crewUserId: string) {
  const crewUser = identity.crewUser;

  if (!crewUser) {
    throw new ForbiddenError('Crew user context is required for crew ownership.');
  }

  if (identity.role === 'platform_admin') {
    return;
  }

  if (crewUser.id !== crewUserId) {
    throw new ForbiddenError('You do not own this crew resource.');
  }
}

export function assertWorkflowActorOwnership(
  identity: PlatformIdentity,
  ownership: WorkflowOwnershipContext,
) {
  if (identity.role === 'platform_admin') {
    return;
  }

  if (identity.businessUser && ownership.businessUserId) {
    if (identity.businessUser.id !== ownership.businessUserId) {
      throw new ForbiddenError('Business user does not own this workflow entity.');
    }
    return;
  }

  if (identity.crewUser && ownership.crewUserId) {
    if (identity.crewUser.id !== ownership.crewUserId) {
      throw new ForbiddenError('Crew user does not own this workflow entity.');
    }
    return;
  }

  throw new ForbiddenError('No ownership match for workflow entity.');
}

export function ownsCompanyProfile(identity: PlatformIdentity, ownerBusinessUserId: string) {
  if (identity.role === 'platform_admin') {
    return true;
  }

  return identity.businessUser?.id === ownerBusinessUserId;
}

export function ownsCrewResource(identity: PlatformIdentity, crewUserId: string) {
  if (identity.role === 'platform_admin') {
    return true;
  }

  return identity.crewUser?.id === crewUserId;
}
