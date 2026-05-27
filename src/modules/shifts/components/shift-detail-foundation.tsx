'use client';

import { ActivityFeed } from '@/shared/components/operational';
import { WorkflowStatusBadge } from '@/shared/components/operational';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ShiftAttendanceIndicator } from './shift-attendance-indicator';
import { ShiftLiveStatusIndicator } from './shift-live-status-indicator';
import { ShiftWorkflowTimeline } from './shift-workflow-timeline';
import { mapShiftActivityToFeedItem, useShiftActivitySubscription } from '@/modules/shifts/hooks';
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
};

export function ShiftDetailFoundation({ shift = placeholderShift, isLoading }: ShiftDetailFoundationProps) {
  useShiftActivitySubscription({ shiftId: shift.id, assignmentId: shift.assignment_id });

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

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow timeline</CardTitle>
            <CardDescription>Append-only transitions from workflow events.</CardDescription>
          </CardHeader>
          <CardContent>
            <ShiftWorkflowTimeline />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity feed</CardTitle>
            <CardDescription>Realtime updates from {`workflow.shifts`}.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={placeholderActivity} emptyMessage="No shift activity yet." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
