import { SHIFT_STATUSES } from '../enums/shift-status';
import { defineWorkflowMachine, workflowRuleMetadata } from './define-workflow-machine';

const REALTIME_TOPIC = 'workflow.shifts';

export const SHIFT_WORKFLOW_TRANSITIONS = [
  {
    from: null,
    to: 'scheduled',
    name: 'create_shift',
    metadata: workflowRuleMetadata({
      guardKeys: ['assignment_not_cancelled'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 200,
    }),
  },
  {
    from: 'scheduled',
    to: 'checked_in',
    name: 'check_in',
    metadata: workflowRuleMetadata({
      guardKeys: ['attendance_window_open', 'qr_or_supervisor_verified'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 210,
    }),
  },
  {
    from: 'scheduled',
    to: 'no_show',
    name: 'mark_no_show',
    metadata: workflowRuleMetadata({
      guardKeys: ['attendance_window_expired'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 220,
    }),
  },
  {
    from: 'scheduled',
    to: 'cancelled',
    name: 'cancel_shift',
    metadata: workflowRuleMetadata({
      guardKeys: ['business_or_admin_authorized'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 230,
    }),
  },
  {
    from: 'checked_in',
    to: 'in_progress',
    name: 'start_shift_work',
    metadata: workflowRuleMetadata({
      guardKeys: ['check_in_verified'],
      requiresServiceRole: true,
      isTerminal: false,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 240,
    }),
  },
  {
    from: 'checked_in',
    to: 'cancelled',
    name: 'cancel_checked_in_shift',
    metadata: workflowRuleMetadata({
      guardKeys: ['supervisor_or_admin_authorized'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 250,
    }),
  },
  {
    from: 'in_progress',
    to: 'completed',
    name: 'complete_shift',
    metadata: workflowRuleMetadata({
      guardKeys: ['checkout_verified', 'supervisor_confirmation'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 260,
    }),
  },
  {
    from: 'in_progress',
    to: 'cancelled',
    name: 'cancel_in_progress_shift',
    metadata: workflowRuleMetadata({
      guardKeys: ['admin_authorized', 'incident_recorded'],
      requiresServiceRole: true,
      isTerminal: true,
      realtimeTopic: REALTIME_TOPIC,
      sortOrder: 270,
    }),
  },
] as const;

export type ShiftTransitionName = (typeof SHIFT_WORKFLOW_TRANSITIONS)[number]['name'];

export const shiftWorkflowMachine = defineWorkflowMachine({
  entityType: 'shift',
  statuses: SHIFT_STATUSES,
  transitions: SHIFT_WORKFLOW_TRANSITIONS,
  source: 'schema.sql#workflow_transition_rules',
});
