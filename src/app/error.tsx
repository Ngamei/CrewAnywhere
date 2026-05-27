'use client';

import { useEffect } from 'react';
import { RetryPanel } from '@/shared/components/operational/retry-ui';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md">
        <RetryPanel
          title="Something went wrong"
          description="CrewAnywhere hit an unexpected error."
          errorMessage={error.message}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
