'use client';

import { ProfileFormShell } from '@/modules/profiles/components/profile-form-shell';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

/**
 * Static form foundation for company profiles — wiring to API mutations comes in onboarding UX.
 */
export function CompanyProfileFormFoundation() {
  return (
    <ProfileFormShell
      title="Company profile"
      description="Core company details for verification and marketplace readiness."
      footer={
        <p className="text-sm text-muted-foreground">
          Save via <code className="text-xs">PATCH /api/v1/company-profiles/:id</code> when connected.
        </p>
      }
    >
      <FormField id="company-name">
        <FormItem>
          <FormLabel>Company name</FormLabel>
          <FormControl>
            <Input name="companyName" placeholder="Acme Events Ltd" disabled />
          </FormControl>
          <FormDescription>Legal trading name shown to crew.</FormDescription>
        </FormItem>
      </FormField>
      <FormField id="legal-name">
        <FormItem>
          <FormLabel>Legal name</FormLabel>
          <FormControl>
            <Input name="legalName" placeholder="Acme Events Limited" disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="registration-number">
        <FormItem>
          <FormLabel>Registration number</FormLabel>
          <FormControl>
            <Input name="registrationNumber" placeholder="12345678" disabled />
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
      <FormField id="description">
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea name="description" placeholder="What does your company do?" rows={4} disabled />
          </FormControl>
        </FormItem>
      </FormField>
    </ProfileFormShell>
  );
}
