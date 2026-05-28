import type { AccountType } from '@/shared/auth/enums';
import { hasPermission } from '@/shared/auth/permissions';
import type { UserRole } from '@/shared/auth/roles';
import type { OnboardingStepDefinition } from '@/modules/onboarding/types/operational-onboarding';

export const OPERATIONAL_ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    id: 'profile_complete',
    title: 'Complete your profile',
    description: 'Add identity, skills or company details, and verification readiness.',
    href: '/dashboard/profile',
    ctaLabel: 'Open profile',
    accountTypes: ['business', 'crew', 'admin'],
    order: 10,
  },
  {
    id: 'first_event',
    title: 'Create your first event',
    description: 'Publish a staffing event to open jobs and crew proposals.',
    href: '/dashboard/events/new',
    ctaLabel: 'Create event',
    accountTypes: ['business', 'admin'],
    permission: 'company_manage',
    order: 20,
  },
  {
    id: 'first_job',
    title: 'Post your first job',
    description: 'Define roles, headcount, and rates under an event.',
    href: '/dashboard/jobs/new',
    ctaLabel: 'Create job',
    accountTypes: ['business', 'admin'],
    permission: 'company_manage',
    order: 30,
  },
  {
    id: 'first_proposal',
    title: 'Review crew proposals',
    description: 'Compare applicants and advance hiring workflows.',
    href: '/dashboard/proposals',
    ctaLabel: 'View proposals',
    accountTypes: ['business', 'admin'],
    permission: 'operations',
    order: 40,
  },
  {
    id: 'marketplace_apply',
    title: 'Apply to your first job',
    description: 'Discover open roles matched to your crew profile.',
    href: '/dashboard/marketplace',
    ctaLabel: 'Browse marketplace',
    accountTypes: ['crew', 'admin'],
    permission: 'crew_marketplace',
    order: 20,
  },
  {
    id: 'first_shift',
    title: 'Track your first shift',
    description: 'Check in, monitor live status, and complete attendance.',
    href: '/dashboard/shifts',
    ctaLabel: 'View shifts',
    accountTypes: ['crew', 'admin'],
    order: 30,
  },
  {
    id: 'wallet_setup',
    title: 'Set up your wallet',
    description: 'View balances, payouts, and withdrawal history after profile activation.',
    href: '/dashboard/wallet',
    ctaLabel: 'Open wallet',
    accountTypes: ['crew', 'admin'],
    order: 40,
  },
  {
    id: 'operational_active',
    title: 'Reach operational activation',
    description: 'Finish verification and readiness gates to run live operations.',
    href: '/dashboard/profile',
    ctaLabel: 'Check readiness',
    accountTypes: ['business', 'crew', 'admin'],
    order: 50,
  },
];

export function filterStepsForActor(input: {
  accountType: AccountType;
  role: UserRole;
}): OnboardingStepDefinition[] {
  const { accountType, role } = input;

  return OPERATIONAL_ONBOARDING_STEPS.filter((step) => {
    if (!step.accountTypes.includes(accountType)) return false;
    if (step.roles && !step.roles.includes(role)) return false;
    if (step.permission && !hasPermission(role, step.permission)) return false;
    return true;
  }).sort((a, b) => a.order - b.order);
}
