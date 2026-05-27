import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.workflow_transition_source` */
export const workflowTransitionSourceEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.workflowTransitionSource}`,
  values: [
    'system',
    'business_user',
    'crew_user',
    'admin',
    'provider_webhook',
    'scheduled_job',
  ] as const,
});

export const WORKFLOW_TRANSITION_SOURCES = workflowTransitionSourceEnum.values;
export type WorkflowTransitionSource = PgEnumValue<typeof workflowTransitionSourceEnum>;
