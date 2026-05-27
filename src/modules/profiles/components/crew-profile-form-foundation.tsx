'use client';

import { ProfileFormShell } from '@/modules/profiles/components/profile-form-shell';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

/**
 * Static form foundation for crew profiles — skills/experience managed via dedicated API routes.
 */
export function CrewProfileFormFoundation() {
  return (
    <ProfileFormShell
      title="Crew profile"
      description="Marketplace-facing profile fields and operational readiness inputs."
      footer={
        <p className="text-sm text-muted-foreground">
          Save via <code className="text-xs">PATCH /api/v1/crew-profiles</code> when connected.
        </p>
      }
    >
      <FormField id="display-name">
        <FormItem>
          <FormLabel>Display name</FormLabel>
          <FormControl>
            <Input name="displayName" placeholder="Alex Rivera" disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="city">
        <FormItem>
          <FormLabel>City</FormLabel>
          <FormControl>
            <Input name="city" placeholder="London" disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="country-code">
        <FormItem>
          <FormLabel>Country</FormLabel>
          <FormControl>
            <Input name="countryCode" placeholder="GB" maxLength={2} disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="hourly-rate">
        <FormItem>
          <FormLabel>Hourly rate</FormLabel>
          <FormControl>
            <Input name="hourlyRateAmount" type="number" placeholder="25.00" disabled />
          </FormControl>
          <FormDescription>Used for proposal matching — not a job offer.</FormDescription>
        </FormItem>
      </FormField>
      <FormField id="introduction">
        <FormItem>
          <FormLabel>Introduction</FormLabel>
          <FormControl>
            <Textarea name="introduction" placeholder="Tell businesses about your experience…" rows={4} disabled />
          </FormControl>
        </FormItem>
      </FormField>
    </ProfileFormShell>
  );
}
