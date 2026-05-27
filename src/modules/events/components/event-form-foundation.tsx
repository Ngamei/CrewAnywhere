'use client';

import { ProfileFormShell } from '@/modules/profiles/components/profile-form-shell';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

export function EventFormFoundation() {
  return (
    <ProfileFormShell
      title="Event details"
      description="Operational metadata for staffing — venue, schedule, and location."
      footer={
        <p className="text-sm text-muted-foreground">
          Save via <code className="text-xs">POST/PATCH /api/v1/events</code> when connected.
        </p>
      }
    >
      <FormField id="event-title">
        <FormItem>
          <FormLabel>Title</FormLabel>
          <FormControl>
            <Input name="title" placeholder="Summer festival" disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="venue-name">
        <FormItem>
          <FormLabel>Venue</FormLabel>
          <FormControl>
            <Input name="venueName" placeholder="Riverside Arena" disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="event-starts">
        <FormItem>
          <FormLabel>Starts</FormLabel>
          <FormControl>
            <Input name="startsAt" type="datetime-local" disabled />
          </FormControl>
          <FormDescription>Schedule drives job publishing readiness.</FormDescription>
        </FormItem>
      </FormField>
      <FormField id="event-ends">
        <FormItem>
          <FormLabel>Ends</FormLabel>
          <FormControl>
            <Input name="endsAt" type="datetime-local" disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="event-city">
        <FormItem>
          <FormLabel>City</FormLabel>
          <FormControl>
            <Input name="city" placeholder="London" disabled />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField id="event-description">
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
