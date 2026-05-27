import { definePgEnum, type PgEnumValue } from './define-pg-enum';

/** @see schema.sql — `public.event_status` */
export const eventStatusEnum = definePgEnum({
  pgType: 'public.event_status',
  values: ['draft', 'open', 'closed', 'cancelled'] as const,
});

export const EVENT_STATUSES = eventStatusEnum.values;
export type EventStatus = PgEnumValue<typeof eventStatusEnum>;
