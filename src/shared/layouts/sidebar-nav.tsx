'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_NAME } from '@/shared/config/site';
import { cn } from '@/shared/lib/cn';
import { operationalNavItems, settingsNavItem } from '@/shared/layouts/navigation-config';

type SidebarNavProps = {
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function SidebarNav({ collapsed = false, className, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const items = [...operationalNavItems, settingsNavItem];

  return (
    <nav className={cn('flex h-full flex-col', className)} aria-label="Main navigation">
      <div className={cn('flex h-top-nav items-center border-b border-border px-4', collapsed && 'justify-center px-2')}>
        <Link href={'/dashboard' as Route} className="font-semibold tracking-tight" onClick={onNavigate}>
          {collapsed ? 'CA' : APP_NAME}
        </Link>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center px-2',
                )}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {!collapsed ? <span>{item.title}</span> : <span className="sr-only">{item.title}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
