'use client';

import type { ReactNode } from 'react';
import { NotificationBell } from '@/modules/notifications/components';
import { OperationalErrorBoundary } from '@/shared/components/operational/error-boundary';

type DashboardShellEnhancementsProps = {
  children: ReactNode;
};

export function DashboardShellEnhancements({ children }: DashboardShellEnhancementsProps) {
  return (
    <OperationalErrorBoundary
      fallbackTitle="Dashboard section unavailable"
      fallbackDescription="An unexpected error occurred in this view. Try again or refresh."
    >
      {children}
    </OperationalErrorBoundary>
  );
}

export function DashboardTopNavActions() {
  return <NotificationBell />;
}
