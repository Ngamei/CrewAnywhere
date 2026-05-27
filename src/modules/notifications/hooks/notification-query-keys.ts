export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: (filter?: Record<string, unknown>) => ['notifications', 'list', filter ?? {}] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  byCategory: (category: string) => ['notifications', 'category', category] as const,
} as const;
