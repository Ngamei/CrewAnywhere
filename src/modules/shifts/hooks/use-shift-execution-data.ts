'use client';

import { useCallback, useMemo, useState } from 'react';
import { fetchApi, ApiClientError } from '@/shared/api/client';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';
import { shiftQueryKeys } from './shift-query-keys';
import type { ShiftDetailDto, ShiftListItemDto } from '@/modules/shifts/types';
import type { ShiftWorkflowEventRow } from './workflow-timeline';
import type { PaymentDto } from '@/modules/payments/types';

type ShiftAction = 'check-in' | 'start' | 'check-out' | 'no-show' | 'cancel';

type ShiftActionState = {
  action: ShiftAction | null;
  isPending: boolean;
  error: string | null;
};

type ShiftActionInput = {
  reason?: string;
  supervisorConfirmed?: boolean;
  incidentRecorded?: boolean;
};

export function useShiftsByAssignment(assignmentId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!assignmentId) throw new Error('assignmentId required');
    return fetchApi<ShiftListItemDto[]>(`/api/v1/assignments/${assignmentId}/shifts`);
  }, [assignmentId]);

  return useOperationalFetch({
    queryKey: assignmentId ? shiftQueryKeys.byAssignment(assignmentId) : ['shifts', 'assignment', 'disabled'],
    fetcher,
    enabled: Boolean(assignmentId),
    initialData: [],
  });
}

export function useShiftDetail(shiftId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!shiftId) throw new Error('shiftId required');
    return fetchApi<ShiftDetailDto>(`/api/v1/shifts/${shiftId}`);
  }, [shiftId]);

  return useOperationalFetch({
    queryKey: shiftId ? shiftQueryKeys.detail(shiftId) : ['shifts', 'detail', 'disabled'],
    fetcher,
    enabled: Boolean(shiftId),
  });
}

export function useShiftTimeline(shiftId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!shiftId) throw new Error('shiftId required');
    return fetchApi<ShiftWorkflowEventRow[]>(`/api/v1/shifts/${shiftId}/timeline`);
  }, [shiftId]);

  return useOperationalFetch({
    queryKey: shiftId ? shiftQueryKeys.timeline(shiftId) : ['shifts', 'timeline', 'disabled'],
    fetcher,
    enabled: Boolean(shiftId),
    initialData: [],
  });
}

export function useAssignmentPayment(assignmentId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!assignmentId) throw new Error('assignmentId required');
    return fetchApi<PaymentDto | null>(`/api/v1/assignments/${assignmentId}/payment`);
  }, [assignmentId]);

  return useOperationalFetch({
    queryKey: assignmentId ? ['payments', 'assignment', assignmentId] : ['payments', 'assignment', 'disabled'],
    fetcher,
    enabled: Boolean(assignmentId),
  });
}

export function useShiftExecutionActions(shiftId: string | undefined, onUpdated?: () => void) {
  const [state, setState] = useState<ShiftActionState>({ action: null, isPending: false, error: null });

  const runAction = useCallback(
    async (action: ShiftAction, input: ShiftActionInput = {}) => {
      if (!shiftId) return;

      setState({ action, isPending: true, error: null });
      try {
        const pathByAction: Record<ShiftAction, string> = {
          'check-in': `/api/v1/shifts/${shiftId}/check-in`,
          start: `/api/v1/shifts/${shiftId}/start`,
          'check-out': `/api/v1/shifts/${shiftId}/check-out`,
          'no-show': `/api/v1/shifts/${shiftId}/no-show`,
          cancel: `/api/v1/shifts/${shiftId}/cancel`,
        };

        await fetchApi(pathByAction[action], {
          method: 'POST',
          body: JSON.stringify(
            action === 'check-in' || action === 'check-out'
              ? { method: 'manual', ...input }
              : input,
          ),
        });

        onUpdated?.();
        setState({ action: null, isPending: false, error: null });
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? `${error.message} (${error.code})`
            : error instanceof Error
              ? error.message
              : 'Shift action failed';
        setState({ action: null, isPending: false, error: message });
      }
    },
    [onUpdated, shiftId],
  );

  return useMemo(
    () => ({
      ...state,
      checkIn: (input?: ShiftActionInput) => runAction('check-in', input),
      startShift: (input?: ShiftActionInput) => runAction('start', input),
      checkOut: (input?: ShiftActionInput) => runAction('check-out', input),
      markNoShow: (input?: ShiftActionInput) => runAction('no-show', input),
      cancelShift: (input?: ShiftActionInput) => runAction('cancel', input),
    }),
    [runAction, state],
  );
}
