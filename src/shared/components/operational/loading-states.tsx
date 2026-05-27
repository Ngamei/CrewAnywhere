import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

export function InlineLoadingSpinner({
  className,
  label = 'Loading',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center justify-center gap-2 text-sm text-muted-foreground', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function ContentLoadingOverlay({
  className,
  label = 'Loading content',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/60 backdrop-blur-[1px]',
        className,
      )}
      aria-busy
      aria-label={label}
    >
      <InlineLoadingSpinner label={label} />
    </div>
  );
}

export function FormSectionSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)} aria-busy aria-label="Loading form">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function OperationalTableSkeleton({
  columns = 4,
  rows = 5,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card', className)} aria-busy aria-label="Loading table">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full max-w-[12rem]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DashboardPanelSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className} aria-busy aria-label="Loading panel">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

export function OperationalPageSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6" aria-busy aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardPanelSkeleton />
        <DashboardPanelSkeleton />
        <DashboardPanelSkeleton className="md:col-span-2 xl:col-span-1" />
      </div>
      <OperationalTableSkeleton />
    </div>
  );
}
