import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import type { ProfileCompletionState } from '@/modules/profiles/types/profile-workflow';

type ProfileCompletionIndicatorProps = {
  title?: string;
  completion: ProfileCompletionState;
};

export function ProfileCompletionIndicator({
  title = 'Profile completion',
  completion,
}: ProfileCompletionIndicatorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>
              {completion.percentComplete}% complete — onboarding{' '}
              {completion.onboardingComplete ? 'done' : 'in progress'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {completion.verificationReady && (
              <Badge variant="secondary">Verification ready</Badge>
            )}
            {completion.operationalReady && (
              <Badge variant="default">Operationally ready</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={completion.percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${completion.percentComplete}%` }}
          />
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {completion.sections.map((section) => (
            <li
              key={section.key}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>{section.label}</span>
              <Badge variant={section.complete ? 'default' : 'outline'}>
                {section.complete ? 'Done' : section.required ? 'Required' : 'Optional'}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
