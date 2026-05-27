'use client';

import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { InlineLoadingSpinner } from '@/shared/components/operational/loading-states';

type RetryPanelProps = {
  title?: string;
  description?: string;
  errorMessage?: string;
  isRetrying?: boolean;
  onRetry: () => void;
  className?: string;
};

export function RetryPanel({
  title = 'Unable to load data',
  description = 'Check your connection and try again.',
  errorMessage,
  isRetrying = false,
  onRetry,
  className,
}: RetryPanelProps) {
  return (
    <Card className={cn('border-destructive/20', className)} role="alert">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {errorMessage ? (
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        ) : null}
        <Button type="button" size="sm" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? (
            <>
              <InlineLoadingSpinner className="mr-2" />
              Retrying…
            </>
          ) : (
            <>
              <RefreshCw className="size-4" aria-hidden />
              Retry
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

type AsyncBoundaryProps = {
  isLoading: boolean;
  error: Error | string | null;
  onRetry: () => void;
  isRetrying?: boolean;
  loadingFallback?: ReactNode;
  children: ReactNode;
};

export function AsyncBoundary({
  isLoading,
  error,
  onRetry,
  isRetrying,
  loadingFallback,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return <>{loadingFallback ?? <InlineLoadingSpinner label="Loading…" className="py-8" />}</>;
  }

  if (error) {
    const message = typeof error === 'string' ? error : error.message;
    return (
      <RetryPanel
        errorMessage={message}
        isRetrying={isRetrying}
        onRetry={onRetry}
      />
    );
  }

  return <>{children}</>;
}
