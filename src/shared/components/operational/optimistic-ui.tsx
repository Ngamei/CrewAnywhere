'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { cn } from '@/shared/lib/cn';

export type OptimisticState<T> = {
  data: T;
  isPending: boolean;
  error: string | null;
};

/**
 * Tracks optimistic local state alongside server truth for operational mutations.
 */
export function useOptimisticState<T>(initialData: T) {
  const [serverData, setServerData] = useState(initialData);
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const data = optimisticData ?? serverData;

  const commit = useCallback((next: T) => {
    setServerData(next);
    setOptimisticData(null);
    setError(null);
  }, []);

  const rollback = useCallback(() => {
    setOptimisticData(null);
  }, []);

  const runOptimistic = useCallback(
    async (next: T, action: () => Promise<T>) => {
      setError(null);
      setOptimisticData(next);

      return new Promise<T>((resolve, reject) => {
        startTransition(() => {
          void (async () => {
            try {
              const result = await action();
              commit(result);
              resolve(result);
            } catch (err) {
              rollback();
              const message = err instanceof Error ? err.message : 'Operation failed';
              setError(message);
              reject(err);
            }
          })();
        });
      });
    },
    [commit, rollback],
  );

  return {
    data,
    isPending,
    error,
    commit,
    rollback,
    runOptimistic,
    setServerData,
  };
}

type OptimisticOverlayProps = {
  isPending?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Visual dim + pointer lock while an optimistic mutation is in flight. */
export function OptimisticOverlay({ isPending, className, children }: OptimisticOverlayProps) {
  return (
    <div
      className={cn('relative', className)}
      aria-busy={isPending}
      data-pending={isPending ? '' : undefined}
    >
      {children}
      {isPending ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-background/40 backdrop-blur-[1px]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

type DebouncedInvalidationOptions = {
  delayMs?: number;
};

/**
 * Coalesces rapid invalidation bursts (e.g. realtime shift events) into one refresh.
 */
export function useDebouncedInvalidation(
  invalidate: (queryKey: readonly unknown[]) => void,
  options?: DebouncedInvalidationOptions,
) {
  const delayMs = options?.delayMs ?? 300;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (queryKey: readonly unknown[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        invalidate(queryKey);
        timerRef.current = null;
      }, delayMs);
    },
    [invalidate, delayMs],
  );
}
