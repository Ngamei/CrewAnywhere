import { ASSIGNMENT_STATUSES } from '../enums/assignment-status';
import { defineWorkflowMachine, workflowRuleMetadata } from './define-workflow-machine';

const REALTIME_TOPIC = 'workflow.assignments';

export const ASSIGNMENT_WORKFLOW_TRANSITIONS = [
  {
    from: null,
    to: 'scheduled',
    name: 'create_assignment',
    metadata: workflowRuleMetadata({
      guardKeys: ['proposal_hired', 'payment_authorized'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 100,
    }),
  },
  {
    from: 'scheduled',
    to: 'active',
    name: 'activate_assignment',
    metadata: workflowRuleMetadata({
      guardKeys: ['assignment_ready', 'event_open'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 110,
    }),
  },
  {
    from: 'scheduled',
    to: 'cancelled',
    name: 'cancel_scheduled_assignment',
    metadata: workflowRuleMetadata({
      guardKeys: ['business_or_admin_authorized'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 120,
    }),
  },
  {
    from: 'active',
    to: 'completed',
    name: 'complete_assignment',
    metadata: workflowRuleMetadata({
      guardKeys: ['all_shifts_closed', 'attendance_validated'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 130,
    }),
  },
  {
    from: 'active',
    to: 'cancelled',
    name: 'cancel_active_assignment',
    metadata: workflowRuleMetadata({
      guardKeys: ['business_or_admin_authorized', 'payment_reversal_ready'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 140,
    }),
  },
] as const;

export type AssignmentTransitionName = (typeof ASSIGNMENT_WORKFLOW_TRANSITIONS)[number]['name'];

export const assignmentWorkflowMachine = defineWorkflowMachine({
  entityType: 'assignment',
  statuses: ASSIGNMENT_STATUSES,
  transitions: ASSIGNMENT_WORKFLOW_TRANSITIONS,
  source: 'schema.sql#workflow_transition_rules',
});
