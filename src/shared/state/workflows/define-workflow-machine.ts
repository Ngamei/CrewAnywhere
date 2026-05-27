import type { WorkflowEntityType } from '../enums/workflow-entity-type';
import type { WorkflowEntityStatusMap } from '../types/workflow-entity-status';
import type {
  WorkflowMachineDefinition,
  WorkflowTransitionDefinition,
  WorkflowTransitionKey,
  WorkflowTransitionMetadata,
} from './types';

const INITIAL_FROM_KEY = '__initial__';

function transitionKey<TStatus extends string>(
  from: TStatus | null,
  to: TStatus,
): WorkflowTransitionKey<TStatus> {
  return from === null ? `${INITIAL_FROM_KEY}->${to}` : `${from}->${to}`;
}

function buildTransitionIndexes<
  TEntityType extends WorkflowEntityType,
  TStatus extends WorkflowEntityStatusMap[TEntityType],
  TTransitions extends readonly WorkflowTransitionDefinition<TEntityType, TStatus, string>[],
>(transitions: TTransitions) {
  const byKey = new Map<WorkflowTransitionKey<TStatus>, TTransitions[number]>();
  const byName = new Map<string, TTransitions[number]>();
  const byFrom = new Map<TStatus | typeof INITIAL_FROM_KEY, TTransitions[number][]>();

  for (const transition of transitions) {
    const fromKey = transition.from ?? INITIAL_FROM_KEY;
    const key = transitionKey(transition.from, transition.to);

    byKey.set(key, transition);
    byName.set(transition.name, transition);

    const bucket = byFrom.get(fromKey as TStatus | typeof INITIAL_FROM_KEY) ?? [];
    bucket.push(transition);
    byFrom.set(fromKey as TStatus | typeof INITIAL_FROM_KEY, bucket);
  }

  for (const bucket of byFrom.values()) {
    bucket.sort((a, b) => a.metadata.sortOrder - b.metadata.sortOrder);
  }

  return { byKey, byName, byFrom };
}

function deriveTerminalStatuses<
  TStatus extends string,
  TTransitions extends readonly { from: TStatus | null; to: TStatus }[],
>(statuses: readonly TStatus[], transitions: TTransitions): readonly TStatus[] {
  const outgoing = new Set<TStatus>();

  for (const transition of transitions) {
    if (transition.from !== null) {
      outgoing.add(transition.from);
    }
  }

  return statuses.filter((status) => !outgoing.has(status));
}

function deriveCreationStatuses<
  TStatus extends string,
  TTransitions extends readonly { from: TStatus | null; to: TStatus }[],
>(transitions: TTransitions): readonly TStatus[] {
  return transitions
    .filter((transition) => transition.from === null)
    .map((transition) => transition.to);
}

/**
 * Builds a read-only workflow machine from database-aligned transition rules.
 * Does not execute transitions — Postgres `transition_workflow_entity` remains authoritative.
 */
export function defineWorkflowMachine<
  const TEntityType extends WorkflowEntityType,
  const TStatus extends WorkflowEntityStatusMap[TEntityType],
  const TTransitions extends readonly WorkflowTransitionDefinition<
    TEntityType,
    TStatus,
    string
  >[],
>(definition: WorkflowMachineDefinition<TEntityType, TStatus, TTransitions>) {
  const indexes = buildTransitionIndexes(definition.transitions);
  const terminalStatuses = deriveTerminalStatuses(definition.statuses, definition.transitions);
  const creationStatuses = deriveCreationStatuses(definition.transitions);
  const terminalStatusSet = new Set<string>(terminalStatuses);
  const terminalTransitionNames = definition.transitions
    .filter((transition) => transition.metadata.isTerminal)
    .map((transition) => transition.name);

  return {
    entityType: definition.entityType,
    source: definition.source,
    statuses: definition.statuses,
    transitions: definition.transitions,
    terminalStatuses,
    creationStatuses,
    terminalTransitionNames,

    getTransition(from: TStatus | null, to: TStatus): TTransitions[number] | undefined {
      return indexes.byKey.get(transitionKey(from, to));
    },

    getTransitionByName(name: string): TTransitions[number] | undefined {
      return indexes.byName.get(name);
    },

    getTransitionsFrom(from: TStatus | null): readonly TTransitions[number][] {
      const fromKey = from ?? INITIAL_FROM_KEY;
      return indexes.byFrom.get(fromKey as TStatus | typeof INITIAL_FROM_KEY) ?? [];
    },

    canTransition(from: TStatus | null, to: TStatus): boolean {
      return indexes.byKey.has(transitionKey(from, to));
    },

    isTerminalStatus(status: TStatus): boolean {
      return terminalStatusSet.has(status);
    },

    assertCanTransition(from: TStatus | null, to: TStatus): void {
      if (!indexes.byKey.has(transitionKey(from, to))) {
        const fromLabel = from ?? INITIAL_FROM_KEY;
        throw new Error(
          `Workflow transition not allowed for ${definition.entityType}: ${fromLabel} -> ${to}`,
        );
      }
    },
  } as const;
}

/** Helper for rule rows seeded in `workflow_transition_rules`. */
export function workflowRuleMetadata(
  metadata: Omit<WorkflowTransitionMetadata, 'ruleVersion'> & { ruleVersion?: 1 },
): WorkflowTransitionMetadata {
  return {
    guardKeys: metadata.guardKeys,
    requiresServiceRole: metadata.requiresServiceRole,
    isTerminal: metadata.isTerminal,
    realtimeTopic: metadata.realtimeTopic,
    sortOrder: metadata.sortOrder,
    ruleVersion: 1,
  };
}

export type DefinedWorkflowMachine = ReturnType<typeof defineWorkflowMachine>;
