'use client';

import { useState } from 'react';
import { ProfileFormShell } from '@/modules/profiles/components/profile-form-shell';
import { Button } from '@/shared/ui/button';
import { FormControl, FormField, FormItem, FormLabel } from '@/shared/ui/form';
import { Textarea } from '@/shared/ui/textarea';
import type { ApiSuccess } from '@/shared/api/responses';
import type { ProposalDto } from '@/modules/proposals/types';

type ProposalSubmissionFormFoundationProps = {
  jobId: string;
  disabled?: boolean;
  onSubmitted?: (proposal: ProposalDto) => void;
};

export function ProposalSubmissionFormFoundation({
  jobId,
  disabled = false,
  onSubmitted,
}: ProposalSubmissionFormFoundationProps) {
  const [coverNote, setCoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (disabled || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/v1/proposals', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          coverNote: coverNote.trim() ? coverNote.trim() : undefined,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | ApiSuccess<ProposalDto>
        | { error?: { message?: string } }
        | null;

      if (!response.ok || !body || !('data' in body)) {
        throw new Error(
          (body && 'error' in body && body.error?.message) || `Unable to submit proposal (${response.status})`,
        );
      }

      setCoverNote('');
      onSubmitted?.(body.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProfileFormShell
      title="Submit proposal"
      description="Apply to this open role using the canonical proposal workflow and readiness checks."
      footer={
        <div className="space-y-2">
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Submits via <code className="text-xs">POST /api/v1/proposals</code>
            </p>
            <Button type="button" onClick={handleSubmit} disabled={disabled || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit proposal'}
            </Button>
          </div>
        </div>
      }
    >
      <FormField id="cover-note">
        <FormItem>
          <FormLabel>Cover note</FormLabel>
          <FormControl>
            <Textarea
              name="coverNote"
              rows={5}
              value={coverNote}
              onChange={(event) => setCoverNote(event.target.value)}
              placeholder="Why you are a fit for this role..."
              maxLength={5000}
              disabled={disabled || isSubmitting}
            />
          </FormControl>
        </FormItem>
      </FormField>
    </ProfileFormShell>
  );
}
