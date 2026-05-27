import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import type {
  ProfileOnboardingPhase,
  ProfileReadinessSnapshot,
} from '@/modules/profiles/types/profile-workflow';

const PHASE_LABELS: Record<ProfileOnboardingPhase, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  verification_pending: 'Verification pending',
  ready: 'Ready',
};

const PHASE_ORDER: ProfileOnboardingPhase[] = [
  'not_started',
  'in_progress',
  'verification_pending',
  'ready',
];

type OnboardingProgressIndicatorProps = {
  snapshot: ProfileReadinessSnapshot;
  title?: string;
};

export function OnboardingProgressIndicator({
  snapshot,
  title = 'Onboarding progress',
}: OnboardingProgressIndicatorProps) {
  const currentIndex = PHASE_ORDER.indexOf(snapshot.onboardingPhase);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>
              Phase: {PHASE_LABELS[snapshot.onboardingPhase]} ·{' '}
              {snapshot.completion.percentComplete}% complete
            </CardDescription>
          </div>
          <Badge variant={snapshot.onboardingPhase === 'ready' ? 'default' : 'secondary'}>
            {PHASE_LABELS[snapshot.onboardingPhase]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="flex flex-wrap gap-2" aria-label="Onboarding phases">
          {PHASE_ORDER.map((phase, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <li
                key={phase}
                className={[
                  'flex-1 min-w-[4.5rem] rounded-lg border px-2 py-2 text-center text-xs',
                  isComplete && 'border-primary/40 bg-primary/5 text-primary',
                  isCurrent && 'border-primary bg-primary/10 font-medium',
                  !isComplete && !isCurrent && 'border-border text-muted-foreground',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {PHASE_LABELS[phase]}
              </li>
            );
          })}
        </ol>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={snapshot.completion.percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${snapshot.completion.percentComplete}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
