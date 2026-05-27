'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { CommandPalette } from '@/shared/layouts/command-palette';
import { MobileNav } from '@/shared/layouts/mobile-nav';
import { SidebarNav } from '@/shared/layouts/sidebar-nav';
import { TopNav } from '@/shared/layouts/top-nav';

type AppShellProps = {
  children: ReactNode;
  title?: string;
  topNavActions?: ReactNode;
  className?: string;
};

export function AppShell({ children, title, topNavActions, className }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className={cn('flex min-h-dvh w-full bg-background', className)}>
      <aside
        className="hidden w-sidebar shrink-0 border-r border-border bg-card md:flex md:flex-col"
        aria-label="Sidebar"
      >
        <SidebarNav />
      </aside>

      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          title={title}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenCommandPalette={() => setCommandOpen(true)}
          actions={topNavActions}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
