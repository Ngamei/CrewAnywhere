'use client';

import { useEffect } from 'react';
import { RetryPanel } from '@/shared/components/operational/retry-ui';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard/error]', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg p-6">
      <RetryPanel
        title="Dashboard unavailable"
        description="We could not load this operational view."
        errorMessage={error.message}
        onRetry={reset}
      />
    </div>
  );
}
