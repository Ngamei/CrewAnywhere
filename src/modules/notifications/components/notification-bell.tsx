'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { NotificationPanel } from '@/modules/notifications/components/notification-panel';
import { useNotificationStore } from '@/modules/notifications/state/notification-store';
import { cn } from '@/shared/lib/cn';

export function NotificationBell({ className }: { className?: string }) {
  const unreadCount = useNotificationStore((state) => state.unreadCount());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={cn('relative', className)}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-0">
        <NotificationPanel />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
