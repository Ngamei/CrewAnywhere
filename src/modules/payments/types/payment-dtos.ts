import type { WorkflowTransitionEventRecord } from '@/backend/services/workflow';
import type { EscrowRecord, PaymentRecord, WithdrawalRequestRecord } from './payment-records';

export type PaymentDto = PaymentRecord & {
  escrow: EscrowRecord | null;
  lastTransition: WorkflowTransitionEventRecord | null;
};

export type PaymentListItemDto = Pick<
  PaymentRecord,
  | 'id'
  | 'assignment_id'
  | 'company_profile_id'
  | 'crew_user_id'
  | 'amount'
  | 'currency'
  | 'status'
  | 'created_at'
  | 'updated_at'
> & {
  escrowStatus: EscrowRecord['status'] | null;
  operationalLabel: string;
};

export type PaymentWithWithdrawalDto = PaymentDto & {
  activeWithdrawal: WithdrawalRequestRecord | null;
};
