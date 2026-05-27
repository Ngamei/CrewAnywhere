'use client';

import { useCallback, useState } from 'react';
import { fetchApi } from '@/shared/api/client';
import type { PayoutPreparationResult } from '@/modules/payments/types';

type PreparePayoutInput = {
  crewUserId: string;
  amount: string;
  currency: string;
};

export function usePayoutPreparation() {
  const [result, setResult] = useState<PayoutPreparationResult | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const prepare = useCallback(async (input: PreparePayoutInput) => {
    setIsPreparing(true);
    setError(null);

    try {
      const preparation = await fetchApi<PayoutPreparationResult>('/api/v1/wallets/payout-preparation', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setResult(preparation);
      return preparation;
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Payout preparation failed');
      setError(nextError);
      setResult(null);
      throw nextError;
    } finally {
      setIsPreparing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isPreparing,
    error,
    prepare,
    reset,
  };
}
