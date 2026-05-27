import { EVENT_STATUS_TRANSITIONS, type EventStatus } from '@/domain/events/status';

export const EVENT_LIFECYCLE_TRANSITIONS = {
  publish: { from: 'draft' as const, to: 'open' as const, name: 'publish_event' },
  close: { from: 'open' as const, to: 'closed' as const, name: 'close_event' },
  cancelFromDraft: { from: 'draft' as const, to: 'cancelled' as const, name: 'cancel_event' },
  cancelFromOpen: { from: 'open' as const, to: 'cancelled' as const, name: 'cancel_event' },
} as const;

export function canTransitionEventLifecycle(from: EventStatus, to: EventStatus) {
  return EVENT_STATUS_TRANSITIONS[from].includes(to);
}

export function assertEventLifecycleTransition(from: EventStatus, to: EventStatus) {
  if (!canTransitionEventLifecycle(from, to)) {
    throw new Error(`Invalid event status transition: ${from} -> ${to}`);
  }
}

export function getAllowedEventTransitions(from: EventStatus): readonly EventStatus[] {
  return EVENT_STATUS_TRANSITIONS[from];
}
