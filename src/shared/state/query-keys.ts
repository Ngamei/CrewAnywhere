import { eventQueryKeys } from '@/modules/events/hooks/event-query-keys';
import { jobQueryKeys } from '@/modules/jobs/hooks/job-query-keys';
import { notificationQueryKeys } from '@/modules/notifications/hooks/notification-query-keys';
import { paymentQueryKeys } from '@/modules/payments/hooks/payment-query-keys';
import { walletQueryKeys } from '@/modules/payments/hooks/wallet-query-keys';
import { profileQueryKeys } from '@/modules/profiles/hooks/profile-query-keys';
import { shiftQueryKeys } from '@/modules/shifts/hooks/shift-query-keys';

export const queryKeys = {
  identity: {
    currentAccount: ['identity', 'current-account'] as const,
  },
  profiles: profileQueryKeys,
  events: eventQueryKeys,
  jobs: jobQueryKeys,
  proposals: {
    all: ['proposals'] as const,
    mine: ['proposals', 'mine'] as const,
    detail: (proposalId: string) => ['proposals', proposalId] as const,
    timeline: (proposalId: string) => ['proposals', proposalId, 'timeline'] as const,
    byJob: (jobId: string) => ['proposals', 'job', jobId] as const,
  },
  marketplace: {
    jobs: (filters: Record<string, unknown>) => ['marketplace', 'jobs', filters] as const,
    availability: ['marketplace', 'availability'] as const,
  },
  assignments: {
    detail: (assignmentId: string) => ['assignments', assignmentId] as const,
    timeline: (assignmentId: string) => ['assignments', assignmentId, 'timeline'] as const,
    byProposal: (proposalId: string) => ['assignments', 'proposal', proposalId] as const,
    byJob: (jobId: string) => ['assignments', 'job', jobId] as const,
  },
  shifts: shiftQueryKeys,
  payments: paymentQueryKeys,
  wallets: walletQueryKeys,
  notifications: notificationQueryKeys,
};
