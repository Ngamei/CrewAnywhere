import type { ReactNode } from 'react';
import { AuthenticatedLayout } from '@/shared/layouts';
import { DashboardOnboardingShell } from '@/modules/onboarding';
import {
  DashboardShellEnhancements,
  DashboardTopNavActions,
} from '@/shared/layouts/dashboard-shell-enhancements';

export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedLayout topNavActions={<DashboardTopNavActions />}>
      <DashboardShellEnhancements>
        <DashboardOnboardingShell>{children}</DashboardOnboardingShell>
      </DashboardShellEnhancements>
    </AuthenticatedLayout>
  );
}
