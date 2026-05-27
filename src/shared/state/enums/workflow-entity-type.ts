import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.workflow_entity_type` */
export const workflowEntityTypeEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.workflowEntityType}`,
  values: [
    'proposal',
    'assignment',
    'shift',
    'payment',
    'withdrawal',
    'kyb',
    'kyc',
  ] as const,
});

export const WORKFLOW_ENTITY_TYPES = workflowEntityTypeEnum.values;
export type WorkflowEntityType = PgEnumValue<typeof workflowEntityTypeEnum>;
