import type { WithdrawalRequestRecord } from './payment-records';
import type { WithdrawalActivityRecord } from './withdrawal-activity-records';
import type { WorkflowTransitionEventRecord } from '@/backend/services/workflow';

export type WithdrawalDto = WithdrawalRequestRecord & {
  lastTransition: WorkflowTransitionEventRecord | null;
};

export type WithdrawalRequestResultDto = {
  withdrawal: WithdrawalDto;
  activity: WithdrawalActivityRecord | null;
};

export type WithdrawalSourcePaymentDto = {
  paymentId: string;
  amount: string;
  currency: string;
  releasedAt: string | null;
  hasActiveWithdrawal: boolean;
};

export type PayoutMethodDto = {
  id: string;
  displayName: string;
  methodType: string;
  isDefault: boolean;
  verified: boolean;
};
