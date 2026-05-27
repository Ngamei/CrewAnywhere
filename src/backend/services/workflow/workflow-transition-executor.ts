import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/shared/api/errors';
import { createSupabaseAdminClient } from '@/shared/supabase/admin';
import { proposalWorkflowMachine } from '@/shared/state/workflows/proposal-lifecycle';
import { assignmentWorkflowMachine } from '@/shared/state/workflows/assignment-lifecycle';
import { shiftWorkflowMachine } from '@/shared/state/workflows/shift-lifecycle';
import { paymentWorkflowMachine } from '@/shared/state/workflows/payment-lifecycle';
import type { WorkflowTransitionCommand, WorkflowTransitionEventRecord } from './types';

/**
 * Canonical executor for `public.transition_workflow_entity`.
 * All proposal, assignment, shift, and payment status changes MUST go through this class.
 */
export class WorkflowTransitionExecutor {
  constructor(private readonly adminClient: SupabaseClient = createSupabaseAdminClient()) {}

  assertTransitionAllowed(command: WorkflowTransitionCommand) {
    const from = command.expectedFromStatus ?? null;
    const to = command.toStatus;

    const allowed =
      command.entityType === 'proposal'
        ? proposalWorkflowMachine.canTransition(
            from as Parameters<typeof proposalWorkflowMachine.canTransition>[0],
            to as Parameters<typeof proposalWorkflowMachine.canTransition>[1],
          )
        : command.entityType === 'assignment'
          ? assignmentWorkflowMachine.canTransition(
              from as Parameters<typeof assignmentWorkflowMachine.canTransition>[0],
              to as Parameters<typeof assignmentWorkflowMachine.canTransition>[1],
            )
          : command.entityType === 'shift'
            ? shiftWorkflowMachine.canTransition(
                from as Parameters<typeof shiftWorkflowMachine.canTransition>[0],
                to as Parameters<typeof shiftWorkflowMachine.canTransition>[1],
              )
            : command.entityType === 'payment'
              ? paymentWorkflowMachine.canTransition(
                  from as Parameters<typeof paymentWorkflowMachine.canTransition>[0],
                  to as Parameters<typeof paymentWorkflowMachine.canTransition>[1],
                )
              : false;

    if (!allowed) {
      throw new AppError(
        'INVALID_WORKFLOW_TRANSITION',
        `Transition not allowed for ${command.entityType}: ${from ?? 'initial'} -> ${to}`,
        422,
      );
    }
  }

  async execute(command: WorkflowTransitionCommand): Promise<WorkflowTransitionEventRecord> {
    if (!command.guardResult.passed) {
      throw new AppError('WORKFLOW_GUARD_FAILED', 'Workflow guard evaluation did not pass.', 422, {
        checks: command.guardResult.checks,
      });
    }

    this.assertTransitionAllowed(command);

    const { data, error } = await this.adminClient.rpc('transition_workflow_entity', {
      input_entity_type: command.entityType,
      input_entity_id: command.entityId,
      input_to_status: command.toStatus,
      input_transition_reason: command.transitionReason,
      input_transitioned_by: command.transitionedBy,
      input_transition_source: command.transitionSource,
      input_guard_result: command.guardResult,
      input_metadata: command.metadata ?? {},
      input_idempotency_key: command.idempotencyKey,
      input_correlation_id: command.correlationId ?? crypto.randomUUID(),
      input_expected_from_status: command.expectedFromStatus ?? undefined,
      input_expected_from_status_version: command.expectedFromStatusVersion ?? undefined,
    });

    if (error) {
      throw new AppError('WORKFLOW_TRANSITION_FAILED', error.message, 422, error);
    }

    return data as WorkflowTransitionEventRecord;
  }
}

export function buildIdempotencyKey(parts: {
  entityType: string;
  entityId: string;
  transitionName: string;
  requestId: string;
}) {
  return `${parts.entityType}:${parts.entityId}:${parts.transitionName}:${parts.requestId}`;
}
