'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { usePayoutPreparation } from '@/modules/payments/hooks/use-payout-preparation';
import { useWithdrawalRequest } from '@/modules/payments/hooks/use-withdrawal-request';
import { usePayoutMethods, useWithdrawalSources } from '@/modules/payments/hooks/use-withdrawal-sources';
import { formatWithdrawalStatusLabel } from '@/modules/payments/hooks/payout-status';
import type { WalletBalanceSummaryDto } from '@/modules/payments/types';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

type WithdrawalRequestPanelProps = {
  crewUserId: string;
  balance: WalletBalanceSummaryDto | undefined;
  payoutsEnabled: boolean;
  isLoading?: boolean;
  onSubmitted?: () => void;
};

export function WithdrawalRequestPanel({
  crewUserId,
  balance,
  payoutsEnabled,
  isLoading,
  onSubmitted,
}: WithdrawalRequestPanelProps) {
  const [amount, setAmount] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [payoutMethodId, setPayoutMethodId] = useState('');
  const { result: preparation, isPreparing, error: prepareError, prepare, reset: resetPrepare } =
    usePayoutPreparation();
  const { result: submission, isSubmitting, error: submitError, submit, reset: resetSubmit } =
    useWithdrawalRequest();
  const sourcesQuery = useWithdrawalSources(crewUserId);
  const methodsQuery = usePayoutMethods(crewUserId);

  const available = balance?.available_balance ?? '0.00';
  const currency = balance?.currency ?? 'USD';
  const amountValid = AMOUNT_PATTERN.test(amount.trim());

  const eligibleSources = useMemo(
    () => (sourcesQuery.data ?? []).filter((source) => !source.hasActiveWithdrawal),
    [sourcesQuery.data],
  );

  const selectedSource = eligibleSources.find((source) => source.paymentId === paymentId);

  const defaultMethodId = useMemo(() => {
    const methods = methodsQuery.data ?? [];
    return methods.find((method) => method.isDefault)?.id ?? methods[0]?.id ?? '';
  }, [methodsQuery.data]);

  const resolvedPayoutMethodId = payoutMethodId || defaultMethodId;

  async function handleValidate() {
    if (!amountValid) return;
    await prepare({
      crewUserId,
      amount: amount.trim(),
      currency,
    });
  }

  async function handleSubmit() {
    if (!preparation?.canPayout || !paymentId || !resolvedPayoutMethodId) return;

    await submit({
      crewUserId,
      paymentId,
      payoutMethodId: resolvedPayoutMethodId,
      amount: amount.trim(),
      currency,
      autoAdvance: true,
    });
    onSubmitted?.();
  }

  function handleReset() {
    setAmount('');
    setPaymentId('');
    setPayoutMethodId('');
    resetPrepare();
    resetSubmit();
  }

  const canValidate =
    payoutsEnabled && amountValid && !isLoading && !isPreparing && Boolean(balance) && Boolean(paymentId);

  const canSubmit =
    preparation?.canPayout &&
    Boolean(paymentId) &&
    Boolean(resolvedPayoutMethodId) &&
    !isSubmitting &&
    !isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request withdrawal</CardTitle>
        <CardDescription>
          Select a released payment source, validate balance, then submit through the withdrawal workflow
          (ledger reservation → approval → payout).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">Available to withdraw</p>
          <p className="text-2xl font-semibold tabular-nums">
            {isLoading ? '—' : `${available} ${currency}`}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="withdrawal-source">Payment source</Label>
          <select
            id="withdrawal-source"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={paymentId}
            onChange={(event) => {
              setPaymentId(event.target.value);
              resetPrepare();
              resetSubmit();
            }}
            disabled={!payoutsEnabled || isLoading || sourcesQuery.isLoading}
          >
            <option value="">Select released payment…</option>
            {eligibleSources.map((source) => (
              <option key={source.paymentId} value={source.paymentId}>
                {source.amount} {source.currency}
                {source.releasedAt
                  ? ` · released ${new Date(source.releasedAt).toLocaleDateString()}`
                  : ''}
              </option>
            ))}
          </select>
          {eligibleSources.length === 0 && !sourcesQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">
              No released payments available for withdrawal. Complete payment release first.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="payout-method">Payout method</Label>
          <select
            id="payout-method"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={resolvedPayoutMethodId}
            onChange={(event) => {
              setPayoutMethodId(event.target.value);
              resetSubmit();
            }}
            disabled={!payoutsEnabled || isLoading || methodsQuery.isLoading}
          >
            <option value="">Select payout method…</option>
            {(methodsQuery.data ?? []).map((method) => (
              <option key={method.id} value={method.id}>
                {method.displayName}
                {method.isDefault ? ' (default)' : ''}
                {method.verified ? '' : ' · unverified'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="withdrawal-amount">Amount</Label>
          <Input
            id="withdrawal-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              resetPrepare();
              resetSubmit();
            }}
            disabled={!payoutsEnabled || isLoading}
          />
          {selectedSource && amountValid ? (
            <p className="text-xs text-muted-foreground">
              Payment cap {selectedSource.amount} {selectedSource.currency}
            </p>
          ) : null}
          {amount.length > 0 && !amountValid ? (
            <p className="text-xs text-destructive">Enter a valid amount (e.g. 100.00).</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void handleValidate()} disabled={!canValidate}>
            {isPreparing ? 'Checking balance…' : 'Validate withdrawal'}
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {isSubmitting ? 'Submitting…' : 'Submit withdrawal'}
          </Button>
          {preparation || submission || prepareError || submitError ? (
            <Button type="button" variant="ghost" onClick={handleReset}>
              Clear
            </Button>
          ) : null}
        </div>

        {prepareError ? <p className="text-sm text-destructive">{prepareError.message}</p> : null}
        {submitError ? <p className="text-sm text-destructive">{submitError.message}</p> : null}

        {preparation ? (
          <div className="space-y-2 rounded-md border px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={preparation.canPayout ? 'default' : 'destructive'}>
                {preparation.canPayout ? 'Ready to request' : 'Insufficient balance'}
              </Badge>
              <span className="text-sm tabular-nums text-muted-foreground">
                {preparation.requestedAmount} {preparation.currency} of {preparation.availableBalance}{' '}
                available
              </span>
            </div>
          </div>
        ) : null}

        {submission ? (
          <div className="space-y-2 rounded-md border border-green-500/30 bg-green-500/5 px-4 py-3">
            <p className="text-sm font-medium">Withdrawal submitted</p>
            <p className="text-xs text-muted-foreground">
              Status {formatWithdrawalStatusLabel(submission.withdrawal.status)} · ID{' '}
              {submission.withdrawal.id.slice(0, 8)}…
            </p>
            {submission.activity ? (
              <p className="text-xs text-muted-foreground">
                Ledger group {submission.activity.ledgerEntryGroupId.slice(0, 8)}… posted
                {submission.activity.replayed ? ' (replay)' : ''}
              </p>
            ) : null}
          </div>
        ) : null}

        {!payoutsEnabled ? (
          <p className="text-xs text-destructive">Payouts are disabled on this wallet. Contact support to enable.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
