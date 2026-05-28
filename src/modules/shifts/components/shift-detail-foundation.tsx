'use client';

import { useMemo } from 'react';
import { CircleX, Play, LogIn, LogOut } from 'lucide-react';
import { ActivityFeed } from '@/shared/components/operational';
import { WorkflowStatusBadge } from '@/shared/components/operational';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PaymentStatusBadge } from '@/modules/payments/components/payment-status-badge';
import { isPlatformSessionPayload } from '@/shared/auth/types';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';
import { ShiftAttendanceIndicator } from './shift-attendance-indicator';
import { ShiftLiveStatusIndicator } from './shift-live-status-indicator';
import { ShiftWorkflowTimeline } from './shift-workflow-timeline';
import {
  mapShiftActivityToFeedItem,
  useAssignmentPayment,
  useShiftActivitySubscription,
  useShiftExecutionActions,
  useShiftTimeline,
} from '@/modules/shifts/hooks';
import type { ShiftDetailDto } from '@/modules/shifts/types';

const placeholderShift: ShiftDetailDto = {
  id: '00000000-0000-0000-0000-000000000050',
  assignment_id: '00000000-0000-0000-0000-000000000041',
  event_id: '00000000-0000-0000-0000-000000000001',
  job_id: '00000000-0000-0000-0000-000000000010',
  company_profile_id: '00000000-0000-0000-0000-000000000002',
  crew_user_id: '00000000-0000-0000-0000-000000000040',
  supervisor_business_user_id: null,
  status: 'checked_in',
  status_version: 2,
  starts_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  ends_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
  check_in_at: new Date().toISOString(),
  check_out_at: null,
  updated_at: new Date().toISOString(),
};

const placeholderActivity = [
  mapShiftActivityToFeedItem({
    workflow_event_id: '00000000-0000-0000-0000-000000000201',
    entity_type: 'shift',
    entity_id: placeholderShift.id,
    from_status: 'scheduled',
    from_status_version: 1,
    to_status: 'checked_in',
    to_status_version: 2,
    transition_rule_id: '00000000-0000-0000-0000-000000000301',
    transition_rule_version: 1,
    correlation_id: '00000000-0000-0000-0000-000000000401',
    transition_source: 'supervisor_user',
    created_at: new Date().toISOString(),
  }),
];

type ShiftDetailFoundationProps = {
  shift?: ShiftDetailDto;
  isLoading?: boolean;
  onShiftUpdated?: () => void;
};

export function ShiftDetailFoundation({
  shift = placeholderShift,
  isLoading,
  onShiftUpdated,
}: ShiftDetailFoundationProps) {
  const { data: session } = usePlatformSession();
  const role = session && isPlatformSessionPayload(session) ? session.identity.role : 'crew';
  const isCrewView = role === 'crew';
  const isBusinessView =
    role === 'business_owner' || role === 'business_member' || role === 'supervisor' || role === 'platform_admin';

  useShiftActivitySubscription({ shiftId: shift.id, assignmentId: shift.assignment_id });
  const timeline = useShiftTimeline(shift.id);
  const payment = useAssignmentPayment(shift.assignment_id);
  const actions = useShiftExecutionActions(shift.id, onShiftUpdated);
  const timelineEvents = timeline.data ?? [];

  const canCheckIn = isCrewView && shift.status === 'scheduled';
  const canStart = isCrewView && shift.status === 'checked_in';
  const canCheckOut = isCrewView && shift.status === 'in_progress';
  const canMarkNoShow = isBusinessView && shift.status === 'scheduled';
  const canCancel = isBusinessView && ['scheduled', 'checked_in', 'in_progress'].includes(shift.status);
  const activityItems =
    timelineEvents.length > 0
      ? timelineEvents.map((event) =>
          mapShiftActivityToFeedItem({
            workflow_event_id: event.workflow_event_id,
            entity_type: 'shift',
            entity_id: shift.id,
            from_status: event.from_status,
            from_status_version: 0,
            to_status: event.to_status,
            to_status_version: 0,
            transition_rule_id: '00000000-0000-0000-0000-000000000000',
            transition_rule_version: 0,
            correlation_id: '00000000-0000-0000-0000-000000000000',
            transition_source: event.transition_source ?? 'system',
            created_at: event.created_at,
          }),
        )
      : placeholderActivity;

  const crewActionLabel = useMemo(() => {
    if (canCheckIn) return 'Check in';
    if (canStart) return 'Start shift';
    if (canCheckOut) return 'Check out';
    return 'No crew action available';
  }, [canCheckIn, canCheckOut, canStart]);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy aria-label="Loading shift detail">
        <div className="h-10 animate-pulse rounded-md bg-muted" />
        <div className="h-32 animate-pulse rounded-md bg-muted" />
        <div className="h-48 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <WorkflowStatusBadge status={shift.status} />
        <p className="text-sm text-muted-foreground">
          Assignment <span className="font-mono text-xs">{shift.assignment_id.slice(0, 8)}…</span>
        </p>
      </div>

      <ShiftLiveStatusIndicator shiftId={shift.id} assignmentId={shift.assignment_id} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ShiftAttendanceIndicator
          status={shift.status}
          checkInAt={shift.check_in_at}
          checkOutAt={shift.check_out_at}
        />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Schedule</CardTitle>
            <CardDescription>Operational window for this shift instance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Starts</span>{' '}
              <span className="font-medium">{new Date(shift.starts_at).toLocaleString()}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Ends</span>{' '}
              <span className="font-medium">{new Date(shift.ends_at).toLocaleString()}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Status version</span>{' '}
              <span className="font-medium">{shift.status_version}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Shift execution controls</CardTitle>
          <CardDescription>
            Mobile-first operational actions with workflow-safe transitions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              type="button"
              onClick={() => actions.checkIn({ reason: 'Crew mobile check-in' })}
              disabled={!canCheckIn || actions.isPending}
              className="justify-start"
            >
              <LogIn className="size-4" aria-hidden />
              Check in
            </Button>
            <Button
              type="button"
              onClick={() => actions.startShift({ reason: 'Shift started by crew' })}
              disabled={!canStart || actions.isPending}
              variant="secondary"
              className="justify-start"
            >
              <Play className="size-4" aria-hidden />
              Start shift
            </Button>
            <Button
              type="button"
              onClick={() =>
                actions.checkOut({
                  reason: 'Crew mobile check-out',
                  supervisorConfirmed: isBusinessView,
                })
              }
              disabled={!canCheckOut || actions.isPending}
              variant="outline"
              className="justify-start"
            >
              <LogOut className="size-4" aria-hidden />
              Check out
            </Button>
          </div>

          {isBusinessView ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={() => actions.markNoShow({ reason: 'Attendance window expired' })}
                disabled={!canMarkNoShow || actions.isPending}
                variant="outline"
                className="justify-start"
              >
                <CircleX className="size-4" aria-hidden />
                Mark no-show
              </Button>
              <Button
                type="button"
                onClick={() => actions.cancelShift({ reason: 'Cancelled by operations' })}
                disabled={!canCancel || actions.isPending}
                variant="destructive"
                className="justify-start"
              >
                <CircleX className="size-4" aria-hidden />
                Cancel shift
              </Button>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Next action: <span className="font-medium text-foreground">{crewActionLabel}</span>
          </p>
          {actions.error ? <p className="text-sm text-destructive">{actions.error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Completion and payment visibility</CardTitle>
          <CardDescription>
            Escrow release orchestration remains workflow-owned; this view is read-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {payment.data ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Payment status</span>
                <PaymentStatusBadge status={payment.data.status} showOperationalLabel />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Escrow</span>
                <span className="font-medium">{payment.data.escrow?.status ?? 'Not initialized'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {payment.data.amount} {payment.data.currency}
                </span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              Payment record not found for this assignment yet.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow timeline</CardTitle>
            <CardDescription>Append-only transitions from workflow events.</CardDescription>
          </CardHeader>
          <CardContent>
            <ShiftWorkflowTimeline events={timelineEvents} isLoading={timeline.isLoading} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity feed</CardTitle>
            <CardDescription>Realtime updates from {`workflow.shifts`}.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activityItems} emptyMessage="No shift activity yet." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
