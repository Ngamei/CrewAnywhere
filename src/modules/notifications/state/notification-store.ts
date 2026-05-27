'use client';

import { create } from 'zustand';
import {
  buildActivityNotification,
  buildWorkflowNotification,
} from '@/modules/notifications/hooks/notification-builders';
import type {
  NotificationCategory,
  NotificationFilter,
  OperationalNotification,
} from '@/modules/notifications/types';

const FOUNDATION_SEED_NOTIFICATIONS: OperationalNotification[] = [
  buildActivityNotification({
    title: 'Welcome to operational activity',
    body: 'Realtime domain events will stream here as workflows progress.',
    href: '/dashboard/activity',
  }),
  buildWorkflowNotification({
    title: 'Workflow notifications enabled',
    body: 'Lifecycle transitions surface in the bell menu as they occur.',
    href: '/dashboard/workflows',
  }),
];

type NotificationState = {
  notifications: OperationalNotification[];
  push: (notification: OperationalNotification) => void;
  markRead: (id: string) => void;
  markAllRead: (category?: NotificationCategory) => void;
  archive: (id: string) => void;
  clear: () => void;
  filter: (filter?: NotificationFilter) => OperationalNotification[];
  unreadCount: (category?: NotificationCategory) => number;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: FOUNDATION_SEED_NOTIFICATIONS,

  push: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 200),
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, status: 'read' as const } : n,
      ),
    })),

  markAllRead: (category) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        !category || n.category === category ? { ...n, status: 'read' as const } : n,
      ),
    })),

  archive: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, status: 'archived' as const } : n,
      ),
    })),

  clear: () => set({ notifications: [] }),

  filter: (filter) => {
    const { notifications } = get();
    return notifications.filter((n) => {
      if (n.status === 'archived') return false;
      if (filter?.category && n.category !== filter.category) return false;
      if (filter?.status && n.status !== filter.status) return false;
      return true;
    });
  },

  unreadCount: (category) => {
    const { notifications } = get();
    return notifications.filter(
      (n) => n.status === 'unread' && (!category || n.category === category),
    ).length;
  },
}));
