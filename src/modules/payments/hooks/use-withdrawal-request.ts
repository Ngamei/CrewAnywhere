'use client';

import { useCallback, useState } from 'react';
import { fetchApi } from '@/shared/api/client';
import type { WithdrawalRequestResultDto } from '@/modules/payments/types';

type SubmitWithdrawalInput = {
  crewUserId: string;
  paymentId: string;
  payoutMethodId?: string;
  amount: string;
  currency: string;
  autoAdvance?: boolean;
};

export function useWithdrawalRequest() {
  const [result, setResult] = useState<WithdrawalRequestResultDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(async (input: SubmitWithdrawalInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetchApi<WithdrawalRequestResultDto>(
        `/api/v1/wallets/${input.crewUserId}/withdrawals`,
        {
          method: 'POST',
          body: JSON.stringify({
            paymentId: input.paymentId,
            payoutMethodId: input.payoutMethodId,
            amount: input.amount,
            currency: input.currency,
            autoAdvance: input.autoAdvance,
          }),
        },
      );
      setResult(response);
      return response;
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Withdrawal request failed');
      setError(nextError);
      setResult(null);
      throw nextError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isSubmitting,
    error,
    submit,
    reset,
  };
}
