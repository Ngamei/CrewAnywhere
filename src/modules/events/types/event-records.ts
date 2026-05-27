import type { EventStatus } from '@/shared/state/enums/event-status';

/** Row shape for `public.events`. */
export type EventRecord = {
  id: string;
  company_profile_id: string;
  created_by_business_user_id: string;
  title: string;
  description: string | null;
  venue_name: string | null;
  address_line: string | null;
  city: string | null;
  country_code: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: EventStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
