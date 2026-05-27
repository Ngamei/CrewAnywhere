'use client';

import type { ReactNode } from 'react';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { StateIndicator } from '@/shared/components/operational/state-indicator';
import { cn } from '@/shared/lib/cn';

type TopNavProps = {
  title?: string;
  onOpenMobileNav?: () => void;
  onOpenCommandPalette?: () => void;
  className?: string;
  actions?: ReactNode;
};

export function TopNav({
  title = 'Operations',
  onOpenMobileNav,
  onOpenCommandPalette,
  className,
  actions,
}: TopNavProps) {
  return (
    <header
      className={cn(
        'flex h-top-nav shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm md:px-6',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
      </div>
      <StateIndicator variant="live" label="Realtime ready" className="hidden sm:inline-flex" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden gap-2 sm:inline-flex"
        onClick={onOpenCommandPalette}
        aria-label="Open command palette"
      >
        <Search className="size-4" />
        <span className="hidden lg:inline">Search</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[10px] lg:inline">
          ⌘K
        </kbd>
      </Button>
      {actions}
    </header>
  );
}
