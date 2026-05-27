'use client';

import { useCallback } from 'react';
import { fetchApi } from '@/shared/api/client';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';
import { paymentQueryKeys } from './payment-query-keys';
import type {
  EscrowReadModel,
  EscrowTimelineEntry,
  LedgerGroupTimelineDto,
  PaymentListItemDto,
  PaymentWithWithdrawalDto,
} from '@/modules/payments/types';

type PaymentTimelineEvent = {
  workflow_event_id: string;
  from_status: string | null;
  to_status: string;
  transition_reason: string | null;
  transition_source: string | null;
  created_at: string;
};

export function usePaymentsList(filters: { crewUserId?: string; companyProfileId?: string; status?: string } = {}) {
  const search = new URLSearchParams();
  if (filters.companyProfileId) search.set('companyProfileId', filters.companyProfileId);
  if (filters.crewUserId) search.set('crewUserId', filters.crewUserId);
  if (filters.status) search.set('status', filters.status);
  const query = search.toString();

  const fetcher = useCallback(
    () => fetchApi<PaymentListItemDto[]>(`/api/v1/payments${query ? `?${query}` : ''}`),
    [query],
  );

  return useOperationalFetch({
    queryKey: paymentQueryKeys.list(filters),
    fetcher,
    initialData: [],
  });
}

export function usePaymentDetail(paymentId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!paymentId) throw new Error('paymentId required');
    return fetchApi<PaymentWithWithdrawalDto>(`/api/v1/payments/${paymentId}`);
  }, [paymentId]);

  return useOperationalFetch({
    queryKey: paymentId ? paymentQueryKeys.detail(paymentId) : ['payments', 'detail', 'disabled'],
    fetcher,
    enabled: Boolean(paymentId),
  });
}

export function usePaymentTimeline(paymentId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!paymentId) throw new Error('paymentId required');
    return fetchApi<PaymentTimelineEvent[]>(`/api/v1/payments/${paymentId}/timeline`);
  }, [paymentId]);

  return useOperationalFetch({
    queryKey: paymentId ? paymentQueryKeys.timeline(paymentId) : ['payments', 'timeline', 'disabled'],
    fetcher,
    enabled: Boolean(paymentId),
    initialData: [],
  });
}

export function usePaymentEscrow(paymentId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!paymentId) throw new Error('paymentId required');
    return fetchApi<EscrowReadModel | null>(`/api/v1/payments/${paymentId}/escrow`);
  }, [paymentId]);

  return useOperationalFetch({
    queryKey: paymentId ? paymentQueryKeys.escrow(paymentId) : ['payments', 'escrow', 'disabled'],
    fetcher,
    enabled: Boolean(paymentId),
  });
}

export function usePaymentEscrowTimeline(paymentId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!paymentId) throw new Error('paymentId required');
    return fetchApi<EscrowTimelineEntry[]>(`/api/v1/payments/${paymentId}/escrow?view=timeline`);
  }, [paymentId]);

  return useOperationalFetch({
    queryKey: paymentId ? [...paymentQueryKeys.escrow(paymentId), 'timeline'] : ['payments', 'escrow-timeline', 'disabled'],
    fetcher,
    enabled: Boolean(paymentId),
    initialData: [],
  });
}

export function usePaymentLedgerHistory(paymentId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!paymentId) throw new Error('paymentId required');
    return fetchApi<LedgerGroupTimelineDto[]>(`/api/v1/payments/${paymentId}/ledger`);
  }, [paymentId]);

  return useOperationalFetch({
    queryKey: paymentId ? paymentQueryKeys.ledgerHistory(paymentId) : ['payments', 'ledger', 'disabled'],
    fetcher,
    enabled: Boolean(paymentId),
    initialData: [],
  });
}
