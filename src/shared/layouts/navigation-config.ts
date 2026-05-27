import type { Route } from 'next';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Clock,
  CreditCard,
  Store,
  Wallet,
  LayoutDashboard,
  ListChecks,
  Radio,
  Settings,
  UserCircle,
  Workflow,
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: Route;
  icon: LucideIcon;
  description?: string;
};

/** Operational shell navigation — domain modules plug in later. */
export const operationalNavItems: NavItem[] = [
  {
    title: 'Overview',
    href: '/dashboard' as Route,
    icon: LayoutDashboard,
    description: 'Operational summary and health',
  },
  {
    title: 'Workflows',
    href: '/dashboard/workflows' as Route,
    icon: Workflow,
    description: 'Lifecycle queues and transitions',
  },
  {
    title: 'Activity',
    href: '/dashboard/activity' as Route,
    icon: Activity,
    description: 'Realtime event and outbox feed',
  },
  {
    title: 'Queues',
    href: '/dashboard/queues' as Route,
    icon: ListChecks,
    description: 'Operational work queues',
  },
  {
    title: 'Live ops',
    href: '/dashboard/live' as Route,
    icon: Radio,
    description: 'Realtime operational monitoring',
  },
  {
    title: 'Profile',
    href: '/dashboard/profile' as Route,
    icon: UserCircle,
    description: 'Business and crew profile foundation',
  },
  {
    title: 'Events',
    href: '/dashboard/events' as Route,
    icon: CalendarDays,
    description: 'Staffing events and schedules',
  },
  {
    title: 'Jobs',
    href: '/dashboard/jobs' as Route,
    icon: Briefcase,
    description: 'Roles, requirements, and compensation',
  },
  {
    title: 'Marketplace',
    href: '/dashboard/marketplace' as Route,
    icon: Store,
    description: 'Crew job discovery and applications',
  },
  {
    title: 'Proposals',
    href: '/dashboard/proposals' as Route,
    icon: ClipboardList,
    description: 'Proposal review and workflow orchestration',
  },
  {
    title: 'Shifts',
    href: '/dashboard/shifts' as Route,
    icon: Clock,
    description: 'Attendance, check-in, and shift lifecycle operations',
  },
  {
    title: 'Payments',
    href: '/dashboard/payments' as Route,
    icon: CreditCard,
    description: 'Assignment payments, escrow, and reconciliation',
  },
  {
    title: 'Wallet',
    href: '/dashboard/wallet' as Route,
    icon: Wallet,
    description: 'Crew wallet balances and ledger activity',
  },
];

export const settingsNavItem: NavItem = {
  title: 'Settings',
  href: '/dashboard/settings' as Route,
  icon: Settings,
  description: 'Platform configuration',
};
