import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type AuthFormFeedbackProps = {
  error?: string | null;
  success?: string | null;
  className?: string;
};

export function AuthFormFeedback({ error, success, className }: AuthFormFeedbackProps) {
  if (!error && !success) {
    return null;
  }

  if (success) {
    return (
      <div
        className={cn(
          'flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground',
          className,
        )}
        role="status"
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        <p>{success}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-foreground',
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <p>{error}</p>
    </div>
  );
}
