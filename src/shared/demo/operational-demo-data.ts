import type { JobListItemDto } from '@/modules/jobs/types/job-dtos';
import type { MarketplaceJobListingDto } from '@/modules/marketplace/types';
import type { ProposalListItemDto } from '@/modules/proposals/types';
import type { ShiftListItemDto } from '@/modules/shifts/types';
import type { WalletActivityFeedItem, PayoutStatusDisplay, WalletBalanceSummaryDto } from '@/modules/payments/types';
import type { OperationalNotification } from '@/modules/notifications/types';

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();
const hoursAhead = (hours: number) => new Date(now + hours * 60 * 60 * 1000).toISOString();

export const demoCrewUsers = [
  { id: '00000000-0000-0000-0000-000000000040', name: 'Ari Santos', city: 'Singapore', role: 'Lead Barista' },
  { id: '00000000-0000-0000-0000-000000000041', name: 'Noah Nguyen', city: 'Ho Chi Minh City', role: 'Kitchen Support' },
  { id: '00000000-0000-0000-0000-000000000042', name: 'Mina Patel', city: 'Kuala Lumpur', role: 'Event Cashier' },
] as const;

export const demoBusinessUsers = [
  { id: '00000000-0000-0000-0000-000000000110', name: 'Kara Lim', role: 'business_owner' },
  { id: '00000000-0000-0000-0000-000000000111', name: 'Ben Tran', role: 'supervisor' },
] as const;

export const demoCompanyProfiles = [
  { id: '00000000-0000-0000-0000-000000000120', companyName: 'CrewAnywhere Events Pte Ltd', city: 'Singapore' },
] as const;

export const demoEvents = [
  { id: '00000000-0000-0000-0000-000000000130', title: 'Marina Bay F&B Expo', startsAt: hoursAhead(30) },
  { id: '00000000-0000-0000-0000-000000000131', title: 'Weekend Night Market', startsAt: hoursAhead(54) },
] as const;

export const demoJobs: JobListItemDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    event_id: '00000000-0000-0000-0000-000000000130',
    company_profile_id: '00000000-0000-0000-0000-000000000120',
    title: 'Senior Barista - Main Stage',
    status: 'open',
    headcount: 4,
    rate_amount: 24,
    updated_at: hoursAgo(2),
    requiredSkillCount: 3,
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    event_id: '00000000-0000-0000-0000-000000000130',
    company_profile_id: '00000000-0000-0000-0000-000000000120',
    title: 'Kitchen Runner - Pop-up Booth',
    status: 'open',
    headcount: 6,
    rate_amount: 18,
    updated_at: hoursAgo(5),
    requiredSkillCount: 2,
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    event_id: '00000000-0000-0000-0000-000000000131',
    company_profile_id: '00000000-0000-0000-0000-000000000120',
    title: 'Cashier - Night Shift',
    status: 'open',
    headcount: 3,
    rate_amount: 20,
    updated_at: hoursAgo(9),
    requiredSkillCount: 2,
  },
];

export const demoMarketplaceJobs: MarketplaceJobListingDto[] = demoJobs.map((job, idx) => ({
  ...job,
  created_by_business_user_id: '00000000-0000-0000-0000-000000000110',
  description:
    idx === 0
      ? 'Serve specialty beverages, coordinate queue flow, and support shift lead reporting.'
      : idx === 1
        ? 'Handle stock runs, prep support, and close-out cleanup with kitchen supervisor.'
        : 'Operate POS, maintain float balance, and coordinate booth reconciliation.',
  rate_currency: 'USD',
  created_at: hoursAgo(24 + idx * 3),
  deleted_at: null,
  skills:
    idx === 0
      ? [
          {
            id: 'skill-01',
            job_id: job.id,
            skill_name: 'Espresso',
            skill_category: 'Beverage',
            required: true,
            sort_order: 1,
            created_at: hoursAgo(24),
            updated_at: hoursAgo(24),
            deleted_at: null,
          },
        ]
      : [
          {
            id: `skill-0${idx + 1}`,
            job_id: job.id,
            skill_name: 'Customer Service',
            skill_category: 'Frontline',
            required: true,
            sort_order: 1,
            created_at: hoursAgo(24),
            updated_at: hoursAgo(24),
            deleted_at: null,
          },
        ],
  eventTitle: demoEvents.find((event) => event.id === job.event_id)?.title ?? null,
  eventStartsAt: demoEvents.find((event) => event.id === job.event_id)?.startsAt ?? null,
  eventEndsAt: hoursAhead(72),
  companyName: demoCompanyProfiles[0].companyName,
  marketplaceVisible: true,
}));

export const demoProposals: ProposalListItemDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000020',
    job_id: '00000000-0000-0000-0000-000000000010',
    crew_user_id: '00000000-0000-0000-0000-000000000040',
    status: 'offer_sent',
    submitted_at: hoursAgo(28),
    updated_at: hoursAgo(4),
    coverNotePreview: '5 years specialty coffee experience and high-volume event operations.',
  },
  {
    id: '00000000-0000-0000-0000-000000000021',
    job_id: '00000000-0000-0000-0000-000000000011',
    crew_user_id: '00000000-0000-0000-0000-000000000041',
    status: 'offer_accepted',
    submitted_at: hoursAgo(20),
    updated_at: hoursAgo(3),
    coverNotePreview: 'Available full schedule, experienced in prep and close-out workflows.',
  },
  {
    id: '00000000-0000-0000-0000-000000000022',
    job_id: '00000000-0000-0000-0000-000000000012',
    crew_user_id: '00000000-0000-0000-0000-000000000042',
    status: 'applied',
    submitted_at: hoursAgo(6),
    updated_at: hoursAgo(2),
    coverNotePreview: 'POS cashier background with nightly reconciliation support.',
  },
];

export const demoAssignments = [
  {
    id: '00000000-0000-0000-0000-000000000041',
    proposalId: '00000000-0000-0000-0000-000000000021',
    status: 'active',
    crewUserId: '00000000-0000-0000-0000-000000000041',
  },
  {
    id: '00000000-0000-0000-0000-000000000042',
    proposalId: '00000000-0000-0000-0000-000000000020',
    status: 'active',
    crewUserId: '00000000-0000-0000-0000-000000000040',
  },
] as const;

export const demoShifts: ShiftListItemDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000030',
    assignment_id: '00000000-0000-0000-0000-000000000041',
    event_id: '00000000-0000-0000-0000-000000000130',
    job_id: '00000000-0000-0000-0000-000000000011',
    crew_user_id: '00000000-0000-0000-0000-000000000041',
    status: 'scheduled',
    starts_at: hoursAhead(2),
    ends_at: hoursAhead(10),
    check_in_at: null,
    check_out_at: null,
    updated_at: hoursAgo(1),
  },
  {
    id: '00000000-0000-0000-0000-000000000031',
    assignment_id: '00000000-0000-0000-0000-000000000041',
    event_id: '00000000-0000-0000-0000-000000000130',
    job_id: '00000000-0000-0000-0000-000000000011',
    crew_user_id: '00000000-0000-0000-0000-000000000041',
    status: 'in_progress',
    starts_at: hoursAgo(1),
    ends_at: hoursAhead(7),
    check_in_at: hoursAgo(1),
    check_out_at: null,
    updated_at: hoursAgo(0.5),
  },
  {
    id: '00000000-0000-0000-0000-000000000032',
    assignment_id: '00000000-0000-0000-0000-000000000042',
    event_id: '00000000-0000-0000-0000-000000000131',
    job_id: '00000000-0000-0000-0000-000000000010',
    crew_user_id: '00000000-0000-0000-0000-000000000040',
    status: 'completed',
    starts_at: hoursAgo(28),
    ends_at: hoursAgo(20),
    check_in_at: hoursAgo(28),
    check_out_at: hoursAgo(20),
    updated_at: hoursAgo(19),
  },
];

export const demoWalletBalance: WalletBalanceSummaryDto = {
  available_balance: '615.00',
  pending_balance: '240.00',
  lifetime_earnings: '3210.00',
  currency: 'USD',
  last_ledger_entry_at: hoursAgo(1),
};

export const demoWalletActivity: WalletActivityFeedItem[] = [
  {
    id: 'wallet-act-1',
    crewUserId: '00000000-0000-0000-0000-000000000041',
    title: 'Escrow release',
    description: 'Shift completion approved by supervisor.',
    amount: '240.00',
    currency: 'USD',
    direction: 'credit',
    transactionType: 'escrow_release',
    timestamp: hoursAgo(2),
    paymentId: '00000000-0000-0000-0000-000000000050',
    withdrawalRequestId: null,
    ledgerEntryGroupId: '00000000-0000-0000-0000-000000000060',
  },
  {
    id: 'wallet-act-2',
    crewUserId: '00000000-0000-0000-0000-000000000041',
    title: 'Withdrawal processing',
    description: 'Payout transfer initiated to default bank account.',
    amount: '120.00',
    currency: 'USD',
    direction: 'debit',
    transactionType: 'withdrawal',
    timestamp: hoursAgo(8),
    paymentId: '00000000-0000-0000-0000-000000000050',
    withdrawalRequestId: '00000000-0000-0000-0000-000000000070',
    ledgerEntryGroupId: '00000000-0000-0000-0000-000000000061',
  },
];

export const demoWithdrawals: PayoutStatusDisplay[] = [
  {
    withdrawalId: '00000000-0000-0000-0000-000000000070',
    paymentId: '00000000-0000-0000-0000-000000000050',
    status: 'approved',
    operationalLabel: 'Approved, waiting payout rail execution',
    tone: 'pending',
    amount: '120.00',
    currency: 'USD',
    requestedAt: hoursAgo(14),
    processedAt: null,
    payoutMethodLabel: 'DBS Bank - **** 9921',
    isTerminal: false,
  },
  {
    withdrawalId: '00000000-0000-0000-0000-000000000071',
    paymentId: '00000000-0000-0000-0000-000000000051',
    status: 'paid',
    operationalLabel: 'Paid to payout account',
    tone: 'success',
    amount: '180.00',
    currency: 'USD',
    requestedAt: hoursAgo(72),
    processedAt: hoursAgo(48),
    payoutMethodLabel: 'Wise - SGD settlement',
    isTerminal: true,
  },
];

export const demoPayments = [
  { id: '00000000-0000-0000-0000-000000000050', status: 'escrow_funded', amount: '240.00' },
  { id: '00000000-0000-0000-0000-000000000051', status: 'released', amount: '180.00' },
] as const;

export const demoNotifications: OperationalNotification[] = [
  {
    id: 'demo-notif-1',
    category: 'assignment',
    title: 'New assignment activated',
    body: 'Noah Nguyen assigned to Kitchen Runner at Marina Bay F&B Expo.',
    href: '/dashboard/shifts',
    priority: 'normal',
    status: 'unread',
    createdAt: hoursAgo(1),
    entityType: 'assignment',
    entityId: '00000000-0000-0000-0000-000000000041',
    source: 'system',
  },
  {
    id: 'demo-notif-2',
    category: 'payment',
    title: 'Escrow release posted',
    body: 'USD 240.00 moved from pending to available wallet balance.',
    href: '/dashboard/wallet',
    priority: 'high',
    status: 'unread',
    createdAt: hoursAgo(2),
    entityType: 'payment',
    entityId: '00000000-0000-0000-0000-000000000050',
    source: 'workflow_event',
  },
  {
    id: 'demo-notif-3',
    category: 'shift_reminder',
    title: 'Shift starts in 2 hours',
    body: 'Check in window opens for Marina Bay F&B Expo assignment.',
    href: '/dashboard/shifts/00000000-0000-0000-0000-000000000030',
    priority: 'high',
    status: 'unread',
    createdAt: hoursAgo(0.5),
    entityType: 'shift',
    entityId: '00000000-0000-0000-0000-000000000030',
    source: 'system',
  },
];

export function getDemoShiftsByAssignment(assignmentId: string) {
  return demoShifts.filter((shift) => shift.assignment_id === assignmentId);
}

export function getDemoDashboardMetrics() {
  const activeJobs = demoJobs.filter((job) => job.status === 'open' || job.status === 'active').length;
  const activeProposals = demoProposals.filter((proposal) =>
    ['applied', 'offer_sent', 'offer_accepted'].includes(proposal.status),
  ).length;
  const activeShifts = demoShifts.filter((shift) => ['scheduled', 'checked_in', 'in_progress'].includes(shift.status)).length;
  const upcomingShifts = demoShifts.filter(
    (shift) => new Date(shift.starts_at).getTime() > now && new Date(shift.starts_at).getTime() < now + 24 * 60 * 60 * 1000,
  ).length;
  const pendingPayouts = demoWithdrawals.filter((withdrawal) => !withdrawal.isTerminal).length;
  const onboardingCompletionPercent = 82;

  return {
    activeJobs,
    activeProposals,
    activeShifts,
    upcomingShifts,
    pendingPayouts,
    onboardingCompletionPercent,
  };
}
