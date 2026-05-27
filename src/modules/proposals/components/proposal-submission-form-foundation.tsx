'use client';

import { ProfileFormShell } from '@/modules/profiles/components/profile-form-shell';
import { FormControl, FormField, FormItem, FormLabel } from '@/shared/ui/form';
import { Textarea } from '@/shared/ui/textarea';

export function ProposalSubmissionFormFoundation() {
  return (
    <ProfileFormShell
      title="Submit proposal"
      description="Apply to an open job — creates proposal and records workflow transition via the canonical engine."
      footer={
        <p className="text-sm text-muted-foreground">
          Submit via <code className="text-xs">POST /api/v1/proposals</code>
        </p>
      }
    >
      <FormField id="cover-note">
        <FormItem>
          <FormLabel>Cover note</FormLabel>
          <FormControl>
            <Textarea name="coverNote" rows={5} placeholder="Why you're a fit for this role…" disabled />
          </FormControl>
        </FormItem>
      </FormField>
    </ProfileFormShell>
  );
}
