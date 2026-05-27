export const WORKFLOW_OUTBOX_STATUSES = [
  'pending',
  'processing',
  'published',
  'failed',
  'dead_lettered',
] as const;

export type WorkflowOutboxStatus = (typeof WORKFLOW_OUTBOX_STATUSES)[number];

export function isWorkflowOutboxStatus(value: string): value is WorkflowOutboxStatus {
  return (WORKFLOW_OUTBOX_STATUSES as readonly string[]).includes(value);
}
