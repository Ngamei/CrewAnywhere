import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/cn';
import type { ProfileReadinessSnapshot } from '@/modules/profiles/types/profile-workflow';

type ReadinessIndicatorProps = {
  snapshot: ProfileReadinessSnapshot;
  compact?: boolean;
  className?: string;
};

export function ReadinessIndicator({ snapshot, compact = false, className }: ReadinessIndicatorProps) {
  const { completion, onboardingPhase, marketplaceReady, businessReady } = snapshot;

  if (compact) {
    return (
      <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
        <Badge variant={completion.operationalReady ? 'default' : 'outline'}>
          {completion.operationalReady ? 'Operational' : `${completion.percentComplete}%`}
        </Badge>
        {onboardingPhase === 'verification_pending' ? (
          <Badge variant="secondary">Verification</Badge>
        ) : null}
      </span>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="status" aria-label="Profile readiness">
      <Badge variant={completion.onboardingComplete ? 'default' : 'outline'}>
        Onboarding {completion.onboardingComplete ? 'complete' : 'in progress'}
      </Badge>
      {completion.verificationReady ? (
        <Badge variant="secondary">Verification ready</Badge>
      ) : null}
      {completion.operationalReady ? (
        <Badge>Operationally ready</Badge>
      ) : null}
      {marketplaceReady ? <Badge variant="secondary">Marketplace ready</Badge> : null}
      {businessReady ? <Badge variant="secondary">Business ready</Badge> : null}
    </div>
  );
}
