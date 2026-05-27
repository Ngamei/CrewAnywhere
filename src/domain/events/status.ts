export const EVENT_STATUSES = ['draft', 'open', 'closed', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ['open', 'closed', 'cancelled'],
  open: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
};
