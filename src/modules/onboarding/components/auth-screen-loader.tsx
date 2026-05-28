import { FormSectionSkeleton } from '@/shared/components/operational/loading-states';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';

export function AuthScreenLoader() {
  return (
    <Card className="w-full max-w-md border-border shadow-sm" aria-busy aria-label="Loading">
      <CardHeader className="space-y-2">
        <div className="h-6 w-40 rounded-md bg-muted" />
        <div className="h-4 w-full max-w-xs rounded-md bg-muted" />
      </CardHeader>
      <CardContent>
        <FormSectionSkeleton rows={3} />
      </CardContent>
    </Card>
  );
}
