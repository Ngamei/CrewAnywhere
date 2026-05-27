import { ForbiddenError } from '@/shared/api/errors';
import { assertBusinessUser } from '@/shared/auth/guards';
import { assertCompanyOwnership } from '@/shared/auth/ownership';
import type { PlatformIdentity } from '@/shared/auth/types';
import type { EventRecord } from '@/modules/events/types/event-records';
import type { JobRecord } from '@/modules/jobs/types/job-records';
import { assertCanManageCompany } from '@/modules/profiles/hooks/ownership-validation';

export function assertJobRecordAccess(
  identity: PlatformIdentity,
  job: JobRecord,
  event: EventRecord,
  ownerBusinessUserId: string,
) {
  assertCanManageCompany(identity);
  assertBusinessUser(identity);

  if (job.event_id !== event.id) {
    throw new ForbiddenError('Job does not belong to the specified event.');
  }

  if (job.company_profile_id !== event.company_profile_id) {
    throw new ForbiddenError('Job company profile does not match event.');
  }

  assertCompanyOwnership(identity, job.company_profile_id, ownerBusinessUserId);
}
