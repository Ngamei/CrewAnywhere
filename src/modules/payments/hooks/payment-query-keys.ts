export const paymentQueryKeys = {
  all: ['payments'] as const,
  list: (filters: { companyProfileId?: string; crewUserId?: string; status?: string }) =>
    [
      'payments',
      'list',
      filters.companyProfileId ?? 'all',
      filters.crewUserId ?? 'all',
      filters.status ?? 'all',
    ] as const,
  detail: (paymentId: string) => ['payments', paymentId] as const,
  byAssignment: (assignmentId: string) => ['payments', 'assignment', assignmentId] as const,
  timeline: (paymentId: string) => ['payments', paymentId, 'timeline'] as const,
  escrow: (paymentId: string) => ['payments', paymentId, 'escrow'] as const,
  ledgerHistory: (paymentId: string) => ['payments', paymentId, 'ledger-history'] as const,
  reconciliation: (paymentId: string) => ['payments', paymentId, 'reconciliation'] as const,
  withdrawal: (paymentId: string) => ['payments', paymentId, 'withdrawal'] as const,
} as const;
