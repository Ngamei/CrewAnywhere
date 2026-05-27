import type { DomainEvent, DomainEventName } from '@/backend/events/domain-event';

/**
 * Foundation publisher — logs domain events until outbox wiring for marketplace entities lands.
 * Replay-safe: callers pass deterministic aggregate ids and idempotency keys in payload.
 */
export function publishStaffingDomainEvent<T extends Record<string, unknown>>(
  name: DomainEventName,
  aggregateId: string,
  payload: T,
  requestId: string,
) {
  const event: DomainEvent<T & { requestId: string }> = {
    id: crypto.randomUUID(),
    name,
    aggregateId,
    occurredAt: new Date().toISOString(),
    payload: { ...payload, requestId },
  };

  if (process.env.NODE_ENV !== 'test') {
    console.info('[staffing-domain-event]', event.name, event.aggregateId);
  }

  return event;
}
