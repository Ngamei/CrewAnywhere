'use client';

import { ShiftLiveStatusIndicator, ShiftsTableFoundation } from '@/modules/shifts/components';
import { OperationalEmptyState } from '@/shared/components/operational';
import { isPlatformSessionPayload } from '@/shared/auth/types';
import { usePlatformSession } from '@/shared/hooks/use-platform-session';
import { useShiftsByAssignment } from '@/modules/shifts/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { getDemoShiftsByAssignment } from '@/shared/demo/operational-demo-data';

const DEMO_ASSIGNMENT_ID = '00000000-0000-0000-0000-000000000041';

export default function ShiftsShellPage() {
  const { data: session, isLoading: isSessionLoading } = usePlatformSession();
  const role = session && isPlatformSessionPayload(session) ? session.identity.role : null;
  const isCrewView = role === 'crew';
  const isBusinessView =
    role === 'business_owner' || role === 'business_member' || role === 'supervisor' || role === 'platform_admin';

  const shifts = useShiftsByAssignment(DEMO_ASSIGNMENT_ID);
  const shiftRows = (shifts.data && shifts.data.length > 0 ? shifts.data : getDemoShiftsByAssignment(DEMO_ASSIGNMENT_ID)) ?? [];
  const totals = {
    assigned: shiftRows.length,
    checkedIn: shiftRows.filter((item) => item.status === 'checked_in' || item.status === 'in_progress').length,
    completed: shiftRows.filter((item) => item.status === 'completed').length,
    noShow: shiftRows.filter((item) => item.status === 'no_show').length,
  };

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Shift operations</h2>
          <p className="text-sm text-muted-foreground">
            Live operational execution for attendance, staffing, and completion state.
          </p>
        </div>
        <ShiftLiveStatusIndicator assignmentId={DEMO_ASSIGNMENT_ID} />
      </div>

      {!isSessionLoading && !isCrewView && !isBusinessView ? (
        <OperationalEmptyState
          variant="shifts"
          title="Shift operations unavailable"
          description="Sign in as crew or business operator to access execution controls."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Assigned shifts</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.assigned}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Checked in / active</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.checkedIn}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.completed}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">No-show risk</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.noShow}</CardContent>
        </Card>
      </div>

      <ShiftsTableFoundation
        data={shiftRows}
        isLoading={shifts.isLoading || isSessionLoading}
        assignmentId={DEMO_ASSIGNMENT_ID}
        showCrewContext={isCrewView}
      />
    </section>
  );
}
