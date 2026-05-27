import type { WorkflowTransitionEventRecord } from '@/backend/services/workflow';
import type { AssignmentRecord } from './assignment-records';

export type AssignmentDto = AssignmentRecord & {
  lastTransition: WorkflowTransitionEventRecord | null;
};
