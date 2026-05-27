export const walletQueryKeys = {
  all: ['wallets'] as const,
  byCrewUser: (crewUserId: string) => ['wallets', 'crew', crewUserId] as const,
  balance: (crewUserId: string) => ['wallets', 'crew', crewUserId, 'balance'] as const,
  activity: (crewUserId: string, filters?: { cursor?: string }) =>
    ['wallets', 'crew', crewUserId, 'activity', filters?.cursor ?? 'head'] as const,
  payoutMethods: (crewUserId: string) => ['wallets', 'crew', crewUserId, 'payout-methods'] as const,
  withdrawals: (crewUserId: string) => ['wallets', 'crew', crewUserId, 'withdrawals'] as const,
} as const;
