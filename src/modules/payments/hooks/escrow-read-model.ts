import type { EscrowReadModel } from '@/modules/payments/types';
import type { EscrowRecord } from '@/modules/payments/types/payment-records';

export function toEscrowReadModel(escrow: EscrowRecord): EscrowReadModel {
  const fundingComplete = escrow.status === 'funded' || escrow.status === 'held' || escrow.status === 'released';
  const releaseEligible = escrow.status === 'funded' || escrow.status === 'held';

  return {
    id: escrow.id,
    payment_id: escrow.payment_id,
    status: escrow.status,
    amount_held: escrow.amount_held,
    currency: escrow.currency,
    funded_at: escrow.funded_at,
    released_at: escrow.released_at,
    providerLabel: escrow.provider,
    fundingComplete,
    releaseEligible,
  };
}
