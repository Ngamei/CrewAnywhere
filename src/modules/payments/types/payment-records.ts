import type { EscrowStatus } from '@/shared/state/enums/escrow-status';
import type { PaymentStatus } from '@/shared/state/enums/payment-status';
import type { WithdrawalStatus } from '@/shared/state/enums/withdrawal-status';

/** Row shape for `public.payments`. */
export type PaymentRecord = {
  id: string;
  assignment_id: string;
  company_profile_id: string;
  crew_user_id: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  status_version: number;
  authorized_at: string | null;
  funded_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.escrow_records`. */
export type EscrowRecord = {
  id: string;
  payment_id: string;
  provider: string | null;
  provider_reference: string | null;
  status: EscrowStatus;
  amount_held: string;
  currency: string;
  funded_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.withdrawal_requests`. */
export type WithdrawalRequestRecord = {
  id: string;
  payment_id: string;
  company_profile_id: string;
  crew_user_id: string;
  payout_method_id: string;
  amount: string;
  currency: string;
  status: WithdrawalStatus;
  status_version: number;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
