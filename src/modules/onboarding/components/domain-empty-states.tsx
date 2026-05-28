'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { OperationalEmptyState } from '@/shared/components/operational/operational-empty-state';
import { Button } from '@/shared/ui/button';
import { useOperationalOnboarding } from '@/modules/onboarding/hooks/use-operational-onboarding';
import { isBusinessActor, isCrewActor } from '@/shared/auth/roles';

function EmptyCta({ href, label }: { href: Route; label: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export function EventsEmptyState() {
  const { role } = useOperationalOnboarding();

  if (!isBusinessActor(role)) {
    return (
      <OperationalEmptyState
        variant="events"
        title="Events are managed by companies"
        description="Business accounts create staffing events. Switch to a business profile or contact your organizer."
      />
    );
  }

  return (
    <OperationalEmptyState
      variant="events"
      title="No events yet"
      description="Create your first staffing event to publish jobs and receive crew proposals."
      action={<EmptyCta href={'/dashboard/events/new' as Route} label="Create first event" />}
    />
  );
}

export function JobsEmptyState() {
  const { role } = useOperationalOnboarding();

  if (!isBusinessActor(role)) {
    return (
      <OperationalEmptyState
        variant="jobs"
        title="No jobs in this view"
        description="Jobs are created under company events. Crew members discover roles via the marketplace."
        action={<EmptyCta href={'/dashboard/marketplace' as Route} label="Browse marketplace" />}
      />
    );
  }

  return (
    <OperationalEmptyState
      variant="jobs"
      title="No jobs yet"
      description="Add roles with headcount and rates under an event to start receiving proposals."
      action={<EmptyCta href={'/dashboard/jobs/new' as Route} label="Create first job" />}
    />
  );
}

export function MarketplaceEmptyState() {
  const { role, snapshot } = useOperationalOnboarding();

  if (!isCrewActor(role)) {
    return (
      <OperationalEmptyState
        variant="marketplace"
        title="Crew marketplace"
        description="Open jobs appear here for crew accounts. Business users manage events and hiring from Events and Proposals."
        action={<EmptyCta href={'/dashboard/events' as Route} label="Go to events" />}
      />
    );
  }

  const profileIncomplete = snapshot && !snapshot.completion.onboardingComplete;

  return (
    <OperationalEmptyState
      variant="marketplace"
      title={profileIncomplete ? 'Complete your profile first' : 'No open jobs right now'}
      description={
        profileIncomplete
          ? 'Finish crew onboarding — skills, rates, and verification — before applying to marketplace roles.'
          : 'Published jobs matching your skills will appear here. Check back after companies post new events.'
      }
      action={
        profileIncomplete ? (
          <EmptyCta href={'/dashboard/profile/crew' as Route} label="Complete profile" />
        ) : (
          <EmptyCta href={'/dashboard/profile/crew' as Route} label="Update marketplace profile" />
        )
      }
    />
  );
}

export function ProposalsEmptyState() {
  const { role } = useOperationalOnboarding();

  if (isCrewActor(role)) {
    return (
      <OperationalEmptyState
        variant="proposals"
        title="No proposals yet"
        description="Apply to marketplace jobs to submit proposals. Track status here once submitted."
        action={<EmptyCta href={'/dashboard/marketplace' as Route} label="Apply to a job" />}
      />
    );
  }

  return (
    <OperationalEmptyState
      variant="proposals"
      title="No proposals to review"
      description="When crew apply to your open jobs, proposals appear here for review and workflow advancement."
      action={<EmptyCta href={'/dashboard/events' as Route} label="Manage events" />}
    />
  );
}

export function ShiftsEmptyState() {
  const { role } = useOperationalOnboarding();

  return (
    <OperationalEmptyState
      variant="shifts"
      title="No shifts scheduled"
      description={
        isCrewActor(role)
          ? 'Assigned shifts with check-in windows will appear here after you are booked on a job.'
          : 'Operational shifts for your assignments will appear here once crew are scheduled.'
      }
      action={
        isCrewActor(role) ? (
          <EmptyCta href={'/dashboard/marketplace' as Route} label="Find work" />
        ) : (
          <EmptyCta href={'/dashboard/events' as Route} label="View events" />
        )
      }
    />
  );
}

export function WalletSetupEmptyState() {
  return (
    <OperationalEmptyState
      variant="payments"
      title="Wallet setup"
      description="Complete crew profile onboarding to open your wallet, view balances, and request withdrawals."
      action={<EmptyCta href={'/dashboard/profile/crew' as Route} label="Complete crew profile" />}
    />
  );
}

export function PaymentsEmptyState() {
  const { role } = useOperationalOnboarding();

  return (
    <OperationalEmptyState
      variant="payments"
      title="No payments yet"
      description={
        isCrewActor(role)
          ? 'Escrow releases and payout events will appear after you complete shifts on booked jobs.'
          : 'Payment workflows and escrow timelines appear here as jobs progress through settlement.'
      }
      action={
        isCrewActor(role) ? (
          <EmptyCta href={'/dashboard/wallet' as Route} label="Open wallet" />
        ) : (
          <EmptyCta href={'/dashboard/proposals' as Route} label="Review proposals" />
        )
      }
    />
  );
}

export function ProfileHubOnboardingPrompt() {
  const { nextStep, overallPercent, isOnboardingComplete } = useOperationalOnboarding();

  if (isOnboardingComplete || !nextStep) return null;

  return (
    <OperationalEmptyState
      variant="profile"
      title="Continue onboarding"
      description={`${overallPercent}% complete — ${nextStep.description}`}
      action={<EmptyCta href={nextStep.href as Route} label={nextStep.ctaLabel} />}
      className="border-solid bg-card"
    />
  );
}
