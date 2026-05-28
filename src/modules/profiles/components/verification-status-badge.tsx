import { Badge } from '@/shared/ui/badge';
import type { VerificationStatus } from '@/shared/state/enums/verification-status';

const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  additional_info_requested: 'Info requested',
  rejected: 'Rejected',
  expired: 'Expired',
  revoked: 'Revoked',
};

const STATUS_VARIANTS: Record<
  VerificationStatus,
  'default' | 'secondary' | 'outline' | 'destructive' | 'warning'
> = {
  pending: 'outline',
  submitted: 'secondary',
  approved: 'default',
  additional_info_requested: 'warning',
  rejected: 'destructive',
  expired: 'outline',
  revoked: 'destructive',
};

type VerificationStatusBadgeProps = {
  status: VerificationStatus | null | undefined;
  label?: string;
};

export function VerificationStatusBadge({ status, label = 'Verification' }: VerificationStatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="outline">
        {label}: Not started
      </Badge>
    );
  }

  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {label}: {STATUS_LABELS[status]}
    </Badge>
  );
}
