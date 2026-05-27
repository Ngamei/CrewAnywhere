import type { ReactNode } from 'react';
import { AppShell } from '@/shared/layouts/app-shell';

type AuthenticatedLayoutProps = {
  children: ReactNode;
  title?: string;
  topNavActions?: ReactNode;
};

/**
 * Authenticated operational dashboard shell.
 * Auth enforcement is applied at the route/middleware layer; this layout is presentation-only.
 */
export function AuthenticatedLayout({ children, title, topNavActions }: AuthenticatedLayoutProps) {
  return (
    <AppShell title={title} topNavActions={topNavActions}>
      <div className="mx-auto w-full max-w-[90rem] p-4 md:p-6">{children}</div>
    </AppShell>
  );
}
