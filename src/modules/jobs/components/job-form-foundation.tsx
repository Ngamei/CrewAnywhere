'use client';

import { ProfileFormShell } from '@/modules/profiles/components/profile-form-shell';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

export function JobFormFoundation() {
  return (
    <ProfileFormShell
      title="Job requirements"
      description="Staffing headcount, compensation, and role skill requirements."
      footer={
        <p className="text-sm text-muted-foreground">
          Save via <code className="text-xs">POST/PATCH /api/v1/jobs</code> when connected.
        </p>
      }
    >
      <FormField id="job-title">
        <FormItem>
          <FormLabel>Role title</FormLabel>
          <FormControl>
            <Input name="title" placeholder="Stage crew" disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="job-headcount">
        <FormItem>
          <FormLabel>Headcount</FormLabel>
          <FormControl>
            <Input name="headcount" type="number" min={1} defaultValue={1} disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="job-rate">
        <FormItem>
          <FormLabel>Hourly rate</FormLabel>
          <FormControl>
            <Input name="rateAmount" type="number" step="0.01" placeholder="25.00" disabled />
          </FormControl>
          <FormDescription>Compensation structure for marketplace proposals.</FormDescription>
        </FormItem>
      </FormField>
      <FormField id="job-skills">
        <FormItem>
          <FormLabel>Required skills</FormLabel>
          <FormControl>
            <Input name="skills" placeholder="Rigging, AV setup" disabled />
          </FormControl>
          <FormDescription>Managed via job skills API — comma-separated placeholder.</FormDescription>
        </FormItem>
      </FormField>
      <FormField id="job-description">
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea name="description" rows={4} disabled />
          </FormControl>
        </FormItem>
      </FormField>
    </ProfileFormShell>
  );
}
