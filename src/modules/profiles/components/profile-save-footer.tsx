'use client';

import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';

type ProfileSaveFooterProps = {
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
  lastSavedAt: Date | null;
  onSave: () => void;
  saveLabel?: string;
  className?: string;
  disabled?: boolean;
};

function formatSavedAt(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function ProfileSaveFooter({
  isSaving,
  isDirty,
  error,
  lastSavedAt,
  onSave,
  saveLabel = 'Save changes',
  className,
  disabled = false,
}: ProfileSaveFooterProps) {
  const statusMessage = error
    ? error
    : isSaving
      ? 'Saving…'
      : isDirty
        ? 'Unsaved changes'
        : lastSavedAt
          ? `Saved at ${formatSavedAt(lastSavedAt)}`
          : 'All changes saved';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p
        className={cn(
          'text-sm',
          error ? 'text-destructive' : isDirty ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
        )}
        role="status"
        aria-live="polite"
      >
        {!error && !isDirty && !isSaving && lastSavedAt ? (
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4 text-emerald-600" aria-hidden />
            {statusMessage}
          </span>
        ) : (
          statusMessage
        )}
      </p>
      <Button
        type="button"
        onClick={onSave}
        disabled={disabled || isSaving || (!isDirty && !error)}
        className="w-full sm:w-auto"
      >
        {isSaving ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          saveLabel
        )}
      </Button>
    </div>
  );
}
