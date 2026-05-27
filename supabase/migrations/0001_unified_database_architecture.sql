-- CrewAnywhere2.0 unified database architecture.
-- Schema inlined from ../../schema.sql for Supabase CLI compatibility.
-- Keep schema.sql as the canonical source; re-inline when schema.sql changes.

create extension if not exists "pgcrypto";

-- Centralized enum definitions
create type public.account_provider as enum ('email', 'google', 'linkedin');
create type public.account_status as enum ('pending_verification', 'active', 'suspended', 'deleted');
create type public.account_type as enum ('business', 'crew', 'admin');
create type public.business_role as enum ('owner', 'admin', 'member');
create type public.verification_status as enum ('pending', 'submitted', 'approved', 'additional_info_requested', 'rejected', 'expired', 'revoked');
create type public.session_status as enum ('active', 'revoked', 'expired');
create type public.company_status as enum ('draft', 'active', 'suspended', 'deleted');
create type public.event_status as enum ('draft', 'open', 'closed', 'cancelled');
create type public.job_status as enum ('draft', 'open', 'reviewing', 'filled', 'active', 'completed', 'closed', 'expired', 'cancelled');
create type public.proposal_status as enum ('applied', 'offer_sent', 'offer_accepted', 'declined', 'withdrawn', 'hired');
create type public.assignment_status as enum ('scheduled', 'active', 'completed', 'cancelled');
create type public.shift_status as enum ('scheduled', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled');
create type public.attendance_verification_method as enum ('qr', 'gps', 'supervisor', 'manual');
create type public.attendance_verification_status as enum ('pending', 'verified', 'rejected');
create type public.incident_severity as enum ('low', 'medium', 'high', 'critical');
create type public.incident_status as enum ('open', 'under_review', 'resolved', 'dismissed');
create type public.payment_status as enum ('pending', 'authorized', 'funded', 'released', 'refunded', 'failed', 'cancelled');
create type public.escrow_status as enum ('awaiting_funding', 'funded', 'partially_funded', 'held', 'released', 'refunded', 'disputed');
create type public.refund_status as enum ('requested', 'approved', 'rejected', 'processed', 'failed');
create type public.withdrawal_status as enum ('requested', 'under_review', 'approved', 'processing', 'paid', 'rejected', 'cancelled');
create type public.payout_method_type as enum ('bank_account', 'paypal', 'wise');
create type public.finance_transaction_type as enum ('escrow_funding', 'escrow_release', 'wallet_credit', 'wallet_debit', 'refund', 'withdrawal', 'withdrawal_payout', 'platform_fee', 'dispute_hold', 'dispute_release', 'reversal', 'reconciliation_adjustment');
create type public.finance_transaction_status as enum ('pending', 'posted', 'failed', 'reversed');
create type public.finance_ledger_account as enum ('business_cash', 'escrow', 'crew_wallet_pending', 'crew_wallet_available', 'platform_revenue', 'refunds_payable', 'withdrawal_clearing', 'external_payout', 'reconciliation');
create type public.finance_entry_direction as enum ('debit', 'credit');
create type public.workflow_entity_type as enum ('proposal', 'assignment', 'shift', 'payment', 'withdrawal', 'kyb', 'kyc');
create type public.workflow_transition_source as enum ('system', 'business_user', 'crew_user', 'admin', 'provider_webhook', 'scheduled_job');
create type public.workflow_outbox_status as enum ('pending', 'processing', 'published', 'failed', 'dead_lettered');
create type public.audit_action as enum ('create', 'update', 'soft_delete', 'status_change', 'auth_event', 'security_event', 'payment_event', 'integration_event');

-- Shared trigger for mutable audit fields
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- AUTH LAYER
create table public.auth_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  account_type public.account_type not null,
  provider public.account_provider not null default 'email',
  provider_subject text,
  status public.account_status not null default 'pending_verification',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint auth_accounts_email_format check (position('@' in email) > 1)
);

create table public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  auth_account_id uuid not null references public.auth_accounts(id) on delete cascade,
  email text not null,
  token_hash text not null,
  status public.verification_status not null default 'pending',
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  auth_account_id uuid not null references public.auth_accounts(id) on delete cascade,
  session_token_hash text not null,
  refresh_token_hash text,
  ip_address inet,
  user_agent text,
  status public.session_status not null default 'active',
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- BUSINESS DOMAIN
create table public.business_users (
  id uuid primary key default gen_random_uuid(),
  auth_account_id uuid not null unique references public.auth_accounts(id) on delete restrict,
  role public.business_role not null default 'owner',
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_business_user_id uuid not null references public.business_users(id) on delete restrict,
  company_name text not null,
  legal_name text,
  registration_number text,
  website_url text,
  description text,
  country_code char(2),
  status public.company_status not null default 'draft',
  business_ready boolean not null default false,
  verified_business boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.business_finance_records (
  id uuid primary key default gen_random_uuid(),
  company_profile_id uuid not null unique references public.company_profiles(id) on delete restrict,
  billing_email text,
  tax_identifier text,
  tax_country_code char(2),
  default_currency char(3) not null default 'USD',
  payment_setup_completed boolean not null default false,
  tax_setup_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.kyb_records (
  id uuid primary key default gen_random_uuid(),
  company_profile_id uuid not null references public.company_profiles(id) on delete restrict,
  status public.verification_status not null default 'pending',
  status_version integer not null default 0 check (status_version >= 0),
  provider text,
  provider_reference text,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- CREW DOMAIN
create table public.crew_users (
  id uuid primary key default gen_random_uuid(),
  auth_account_id uuid not null unique references public.auth_accounts(id) on delete restrict,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.crew_profiles (
  id uuid primary key default gen_random_uuid(),
  crew_user_id uuid not null unique references public.crew_users(id) on delete restrict,
  display_name text not null,
  legal_name text,
  date_of_birth date,
  gender text,
  city text,
  country_code char(2),
  introduction text,
  profile_image_url text,
  hourly_rate_amount numeric(12, 2),
  hourly_rate_currency char(3) not null default 'USD',
  profile_published boolean not null default false,
  marketplace_ready boolean not null default false,
  profile_score integer not null default 0 check (profile_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.crew_skills (
  id uuid primary key default gen_random_uuid(),
  crew_user_id uuid not null references public.crew_users(id) on delete cascade,
  skill_name text not null,
  skill_category text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.crew_experience (
  id uuid primary key default gen_random_uuid(),
  crew_user_id uuid not null references public.crew_users(id) on delete cascade,
  company_name text,
  role_title text not null,
  description text,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint crew_experience_date_order check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.crew_finance_records (
  id uuid primary key default gen_random_uuid(),
  crew_user_id uuid not null unique references public.crew_users(id) on delete restrict,
  legal_name text,
  tax_identifier text,
  tax_country_code char(2),
  tax_setup_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.crew_wallets (
  id uuid primary key default gen_random_uuid(),
  crew_user_id uuid not null unique references public.crew_users(id) on delete restrict,
  default_currency char(3) not null default 'USD',
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.kyc_records (
  id uuid primary key default gen_random_uuid(),
  crew_user_id uuid not null references public.crew_users(id) on delete restrict,
  status public.verification_status not null default 'pending',
  status_version integer not null default 0 check (status_version >= 0),
  document_type text,
  provider text,
  provider_reference text,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- MARKETPLACE DOMAIN
create table public.events (
  id uuid primary key default gen_random_uuid(),
  company_profile_id uuid not null references public.company_profiles(id) on delete restrict,
  created_by_business_user_id uuid not null references public.business_users(id) on delete restrict,
  title text not null,
  description text,
  venue_name text,
  address_line text,
  city text,
  country_code char(2),
  starts_at timestamptz,
  ends_at timestamptz,
  status public.event_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint events_time_order check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  company_profile_id uuid not null references public.company_profiles(id) on delete restrict,
  created_by_business_user_id uuid not null references public.business_users(id) on delete restrict,
  title text not null,
  description text,
  headcount integer not null default 1 check (headcount >= 1),
  rate_amount numeric(12, 2),
  rate_currency char(3) not null default 'USD',
  status public.job_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint jobs_event_company_chain_unique unique (id, event_id, company_profile_id)
);

create table public.job_skills (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_name text not null,
  skill_category text,
  required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  crew_user_id uuid not null references public.crew_users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  company_profile_id uuid not null references public.company_profiles(id) on delete restrict,
  crew_user_id uuid not null references public.crew_users(id) on delete restrict,
  status public.proposal_status not null default 'applied',
  status_version integer not null default 0 check (status_version >= 0),
  cover_note text,
  submitted_at timestamptz not null default now(),
  hired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint proposals_job_chain_fk foreign key (job_id, event_id, company_profile_id)
    references public.jobs (id, event_id, company_profile_id) on delete restrict,
  constraint proposals_identity_chain_unique unique (id, job_id, event_id, company_profile_id, crew_user_id)
);

create table public.proposal_terms (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references public.proposals(id) on delete cascade,
  rate_amount numeric(12, 2),
  rate_currency char(3) not null default 'USD',
  starts_at timestamptz,
  ends_at timestamptz,
  terms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint proposal_terms_time_order check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.proposal_attachments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- OPERATIONS DOMAIN
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references public.proposals(id) on delete restrict,
  job_id uuid not null references public.jobs(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  company_profile_id uuid not null references public.company_profiles(id) on delete restrict,
  crew_user_id uuid not null references public.crew_users(id) on delete restrict,
  status public.assignment_status not null default 'scheduled',
  status_version integer not null default 0 check (status_version >= 0),
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  activated_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint assignments_time_order check (scheduled_end_at is null or scheduled_start_at is null or scheduled_end_at >= scheduled_start_at),
  constraint assignments_proposal_chain_fk foreign key (proposal_id, job_id, event_id, company_profile_id, crew_user_id)
    references public.proposals (id, job_id, event_id, company_profile_id, crew_user_id) on delete restrict,
  constraint assignments_identity_chain_unique unique (id, proposal_id, job_id, event_id, company_profile_id, crew_user_id),
  constraint assignments_payment_chain_unique unique (id, company_profile_id, crew_user_id),
  constraint assignments_shift_chain_unique unique (id, event_id, job_id, company_profile_id, crew_user_id)
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  job_id uuid not null references public.jobs(id) on delete restrict,
  company_profile_id uuid not null references public.company_profiles(id) on delete restrict,
  crew_user_id uuid not null references public.crew_users(id) on delete restrict,
  supervisor_business_user_id uuid references public.business_users(id) on delete set null,
  status public.shift_status not null default 'scheduled',
  status_version integer not null default 0 check (status_version >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint shifts_time_order check (ends_at > starts_at),
  constraint shifts_assignment_chain_fk foreign key (assignment_id, event_id, job_id, company_profile_id, crew_user_id)
    references public.assignments (id, event_id, job_id, company_profile_id, crew_user_id) on delete restrict
);

create table public.attendance_verifications (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  verified_by_business_user_id uuid references public.business_users(id) on delete set null,
  method public.attendance_verification_method not null,
  status public.attendance_verification_status not null default 'pending',
  evidence jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.operational_incidents (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete restrict,
  shift_id uuid references public.shifts(id) on delete restrict,
  reported_by_business_user_id uuid references public.business_users(id) on delete set null,
  reported_by_crew_user_id uuid references public.crew_users(id) on delete set null,
  severity public.incident_severity not null default 'medium',
  status public.incident_status not null default 'open',
  title text not null,
  description text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint operational_incidents_reporter_required check (
    reported_by_business_user_id is not null or reported_by_crew_user_id is not null
  )
);

-- PAYMENT DOMAIN
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assignments(id) on delete restrict,
  company_profile_id uuid not null references public.company_profiles(id) on delete restrict,
  crew_user_id uuid not null references public.crew_users(id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  currency char(3) not null default 'USD',
  status public.payment_status not null default 'pending',
  status_version integer not null default 0 check (status_version >= 0),
  authorized_at timestamptz,
  funded_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint payments_assignment_chain_fk foreign key (assignment_id, company_profile_id, crew_user_id)
    references public.assignments (id, company_profile_id, crew_user_id) on delete restrict,
  constraint payments_withdrawal_chain_unique unique (id, company_profile_id, crew_user_id)
);

create table public.escrow_records (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  provider text,
  provider_reference text,
  status public.escrow_status not null default 'awaiting_funding',
  amount_held numeric(12, 2) not null default 0 check (amount_held >= 0),
  currency char(3) not null default 'USD',
  funded_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  escrow_record_id uuid references public.escrow_records(id) on delete set null,
  requested_by_business_user_id uuid references public.business_users(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency char(3) not null default 'USD',
  status public.refund_status not null default 'requested',
  reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.payout_methods (
  id uuid primary key default gen_random_uuid(),
  crew_user_id uuid not null references public.crew_users(id) on delete restrict,
  method_type public.payout_method_type not null,
  provider text,
  provider_reference text,
  display_name text,
  is_default boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  company_profile_id uuid not null references public.company_profiles(id) on delete restrict,
  crew_user_id uuid not null references public.crew_users(id) on delete restrict,
  payout_method_id uuid not null references public.payout_methods(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  currency char(3) not null default 'USD',
  status public.withdrawal_status not null default 'requested',
  status_version integer not null default 0 check (status_version >= 0),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint withdrawal_payment_chain_fk foreign key (payment_id, company_profile_id, crew_user_id)
    references public.payments (id, company_profile_id, crew_user_id) on delete restrict
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  ledger_entry_group_id uuid not null,
  entry_sequence integer not null,
  payment_id uuid references public.payments(id) on delete restrict,
  escrow_record_id uuid references public.escrow_records(id) on delete restrict,
  refund_id uuid references public.refunds(id) on delete restrict,
  withdrawal_request_id uuid references public.withdrawal_requests(id) on delete restrict,
  company_profile_id uuid references public.company_profiles(id) on delete restrict,
  crew_user_id uuid references public.crew_users(id) on delete restrict,
  ledger_account public.finance_ledger_account not null,
  direction public.finance_entry_direction not null,
  transaction_type public.finance_transaction_type not null,
  status public.finance_transaction_status not null default 'posted',
  amount numeric(12, 2) not null check (amount > 0),
  currency char(3) not null default 'USD',
  idempotency_key text not null,
  reversal_of_transaction_id uuid references public.finance_transactions(id) on delete restrict,
  external_reference text,
  metadata jsonb not null default '{}'::jsonb,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint finance_transactions_not_deleted check (deleted_at is null),
  constraint finance_transactions_anchor_required check (
    payment_id is not null
    or escrow_record_id is not null
    or refund_id is not null
    or withdrawal_request_id is not null
    or company_profile_id is not null
    or crew_user_id is not null
  ),
  constraint finance_transactions_reversal_not_self check (reversal_of_transaction_id is null or reversal_of_transaction_id <> id),
  constraint finance_transactions_group_sequence_unique unique (ledger_entry_group_id, entry_sequence)
);

-- WORKFLOW ORCHESTRATION
create table public.workflow_transition_rules (
  id uuid primary key default gen_random_uuid(),
  entity_type public.workflow_entity_type not null,
  from_status text,
  to_status text not null,
  transition_name text not null,
  rule_version integer not null default 1 check (rule_version >= 1),
  guard_keys text[] not null default '{}'::text[],
  requires_service_role boolean not null default true,
  is_terminal boolean not null default false,
  realtime_topic text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint workflow_transition_rules_no_self_transition check (from_status is null or from_status <> to_status)
);

create table public.workflow_transition_events (
  workflow_event_id uuid primary key default gen_random_uuid(),
  transition_rule_id uuid not null references public.workflow_transition_rules(id) on delete restrict,
  transition_rule_version integer not null check (transition_rule_version >= 1),
  entity_type public.workflow_entity_type not null,
  entity_id uuid not null,
  from_status text,
  from_status_version integer check (from_status_version is null or from_status_version >= 0),
  to_status text not null,
  to_status_version integer not null check (to_status_version >= 0),
  transition_reason text,
  transitioned_by uuid references public.auth_accounts(id) on delete set null,
  transition_source public.workflow_transition_source not null,
  idempotency_key text not null,
  correlation_id uuid not null,
  realtime_topic text,
  guard_result jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint workflow_transition_events_no_self_transition check (from_status is null or from_status <> to_status)
);

create table public.workflow_event_outbox (
  id uuid primary key default gen_random_uuid(),
  workflow_event_id uuid not null unique references public.workflow_transition_events(workflow_event_id) on delete restrict,
  topic text not null,
  payload jsonb not null,
  status public.workflow_outbox_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- AUDIT / GOVERNANCE

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  auth_account_id uuid references public.auth_accounts(id) on delete set null,
  business_user_id uuid references public.business_users(id) on delete set null,
  crew_user_id uuid references public.crew_users(id) on delete set null,
  action public.audit_action not null,
  domain text not null,
  entity_table text,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Updated-at triggers
create trigger set_auth_accounts_updated_at before update on public.auth_accounts for each row execute function public.set_updated_at();
create trigger set_email_verifications_updated_at before update on public.email_verifications for each row execute function public.set_updated_at();
create trigger set_sessions_updated_at before update on public.sessions for each row execute function public.set_updated_at();
create trigger set_business_users_updated_at before update on public.business_users for each row execute function public.set_updated_at();
create trigger set_company_profiles_updated_at before update on public.company_profiles for each row execute function public.set_updated_at();
create trigger set_business_finance_records_updated_at before update on public.business_finance_records for each row execute function public.set_updated_at();
create trigger set_kyb_records_updated_at before update on public.kyb_records for each row execute function public.set_updated_at();
create trigger set_crew_users_updated_at before update on public.crew_users for each row execute function public.set_updated_at();
create trigger set_crew_profiles_updated_at before update on public.crew_profiles for each row execute function public.set_updated_at();
create trigger set_crew_skills_updated_at before update on public.crew_skills for each row execute function public.set_updated_at();
create trigger set_crew_experience_updated_at before update on public.crew_experience for each row execute function public.set_updated_at();
create trigger set_crew_finance_records_updated_at before update on public.crew_finance_records for each row execute function public.set_updated_at();
create trigger set_crew_wallets_updated_at before update on public.crew_wallets for each row execute function public.set_updated_at();
create trigger set_kyc_records_updated_at before update on public.kyc_records for each row execute function public.set_updated_at();
create trigger set_events_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger set_jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger set_job_skills_updated_at before update on public.job_skills for each row execute function public.set_updated_at();
create trigger set_saved_jobs_updated_at before update on public.saved_jobs for each row execute function public.set_updated_at();
create trigger set_proposals_updated_at before update on public.proposals for each row execute function public.set_updated_at();
create trigger set_proposal_terms_updated_at before update on public.proposal_terms for each row execute function public.set_updated_at();
create trigger set_proposal_attachments_updated_at before update on public.proposal_attachments for each row execute function public.set_updated_at();
create trigger set_assignments_updated_at before update on public.assignments for each row execute function public.set_updated_at();
create trigger set_shifts_updated_at before update on public.shifts for each row execute function public.set_updated_at();
create trigger set_attendance_verifications_updated_at before update on public.attendance_verifications for each row execute function public.set_updated_at();
create trigger set_operational_incidents_updated_at before update on public.operational_incidents for each row execute function public.set_updated_at();
create trigger set_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger set_escrow_records_updated_at before update on public.escrow_records for each row execute function public.set_updated_at();
create trigger set_refunds_updated_at before update on public.refunds for each row execute function public.set_updated_at();
create trigger set_payout_methods_updated_at before update on public.payout_methods for each row execute function public.set_updated_at();
create trigger set_withdrawal_requests_updated_at before update on public.withdrawal_requests for each row execute function public.set_updated_at();
create trigger set_workflow_event_outbox_updated_at before update on public.workflow_event_outbox for each row execute function public.set_updated_at();
create trigger set_audit_logs_updated_at before update on public.audit_logs for each row execute function public.set_updated_at();

-- Workflow integrity guards
create or replace function public.guard_proposal_chain()
returns trigger
language plpgsql
as $$
begin
  if new.deleted_at is not null then
    return new;
  end if;

  if not exists (
    select 1
    from public.jobs j
    where j.id = new.job_id
      and j.event_id = new.event_id
      and j.company_profile_id = new.company_profile_id
      and j.deleted_at is null
  ) then
    raise exception 'Invalid proposal chain: job %, event %, company % do not match', new.job_id, new.event_id, new.company_profile_id;
  end if;

  if exists (
    select 1
    from public.proposals p
    where p.job_id = new.job_id
      and p.crew_user_id = new.crew_user_id
      and p.deleted_at is null
      and p.id <> new.id
  ) then
    raise exception 'Invalid proposal chain: active proposal already exists for job % and crew %', new.job_id, new.crew_user_id;
  end if;

  return new;
end;
$$;

create or replace function public.guard_assignment_chain()
returns trigger
language plpgsql
as $$
begin
  if new.deleted_at is not null then
    return new;
  end if;

  if not exists (
    select 1
    from public.proposals p
    where p.id = new.proposal_id
      and p.job_id = new.job_id
      and p.event_id = new.event_id
      and p.company_profile_id = new.company_profile_id
      and p.crew_user_id = new.crew_user_id
      and p.status = 'hired'
      and p.deleted_at is null
  ) then
    raise exception 'Invalid assignment chain: proposal must be hired and match job/event/company/crew ownership';
  end if;

  return new;
end;
$$;

create or replace function public.guard_shift_chain()
returns trigger
language plpgsql
as $$
begin
  if new.deleted_at is not null then
    return new;
  end if;

  if not exists (
    select 1
    from public.assignments a
    where a.id = new.assignment_id
      and a.event_id = new.event_id
      and a.job_id = new.job_id
      and a.company_profile_id = new.company_profile_id
      and a.crew_user_id = new.crew_user_id
      and a.status <> 'cancelled'
      and a.deleted_at is null
  ) then
    raise exception 'Invalid shift chain: assignment must match event/job/company/crew and cannot be cancelled';
  end if;

  return new;
end;
$$;

create or replace function public.guard_payment_chain()
returns trigger
language plpgsql
as $$
begin
  if new.deleted_at is not null then
    return new;
  end if;

  if not exists (
    select 1
    from public.assignments a
    where a.id = new.assignment_id
      and a.company_profile_id = new.company_profile_id
      and a.crew_user_id = new.crew_user_id
      and a.status <> 'cancelled'
      and a.deleted_at is null
  ) then
    raise exception 'Invalid payment chain: assignment must match company/crew and cannot be cancelled';
  end if;

  return new;
end;
$$;

create or replace function public.guard_withdrawal_chain()
returns trigger
language plpgsql
as $$
begin
  if new.deleted_at is not null then
    return new;
  end if;

  if not exists (
    select 1
    from public.payments p
    where p.id = new.payment_id
      and p.company_profile_id = new.company_profile_id
      and p.crew_user_id = new.crew_user_id
      and p.status = 'released'
      and new.amount <= p.amount
      and p.deleted_at is null
  ) then
    raise exception 'Invalid withdrawal chain: payment must be released, match company/crew ownership, and cover withdrawal amount';
  end if;

  if not exists (
    select 1
    from public.payout_methods pm
    where pm.id = new.payout_method_id
      and pm.crew_user_id = new.crew_user_id
      and pm.deleted_at is null
  ) then
    raise exception 'Invalid withdrawal chain: payout method must belong to withdrawal crew user';
  end if;

  return new;
end;
$$;

create or replace function public.guard_finance_transaction_insert()
returns trigger
language plpgsql
as $$
begin
  if new.deleted_at is not null then
    raise exception 'Invalid ledger entry: finance_transactions are immutable and cannot be soft deleted';
  end if;

  if new.payment_id is not null and not exists (
    select 1
    from public.payments p
    where p.id = new.payment_id
      and (new.company_profile_id is null or p.company_profile_id = new.company_profile_id)
      and (new.crew_user_id is null or p.crew_user_id = new.crew_user_id)
      and p.deleted_at is null
  ) then
    raise exception 'Invalid ledger entry: payment ownership does not match company/crew context';
  end if;

  if new.escrow_record_id is not null and not exists (
    select 1
    from public.escrow_records er
    join public.payments p on p.id = er.payment_id
    where er.id = new.escrow_record_id
      and (new.payment_id is null or er.payment_id = new.payment_id)
      and (new.company_profile_id is null or p.company_profile_id = new.company_profile_id)
      and (new.crew_user_id is null or p.crew_user_id = new.crew_user_id)
      and er.deleted_at is null
      and p.deleted_at is null
  ) then
    raise exception 'Invalid ledger entry: escrow ownership does not match payment/company/crew context';
  end if;

  if new.refund_id is not null and not exists (
    select 1
    from public.refunds r
    join public.payments p on p.id = r.payment_id
    where r.id = new.refund_id
      and (new.payment_id is null or r.payment_id = new.payment_id)
      and (new.company_profile_id is null or p.company_profile_id = new.company_profile_id)
      and (new.crew_user_id is null or p.crew_user_id = new.crew_user_id)
      and r.deleted_at is null
      and p.deleted_at is null
  ) then
    raise exception 'Invalid ledger entry: refund ownership does not match payment/company/crew context';
  end if;

  if new.withdrawal_request_id is not null and not exists (
    select 1
    from public.withdrawal_requests wr
    where wr.id = new.withdrawal_request_id
      and (new.payment_id is null or wr.payment_id = new.payment_id)
      and (new.company_profile_id is null or wr.company_profile_id = new.company_profile_id)
      and (new.crew_user_id is null or wr.crew_user_id = new.crew_user_id)
      and wr.deleted_at is null
  ) then
    raise exception 'Invalid ledger entry: withdrawal ownership does not match payment/company/crew context';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_finance_transaction_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'finance_transactions are append-only. Use reversal or reconciliation entries instead of update/delete.';
end;
$$;

create or replace function public.guard_ledger_group_balanced()
returns trigger
language plpgsql
as $$
declare
  ledger_balance numeric(12, 2);
  currency_count integer;
begin
  select count(distinct currency)
  into currency_count
  from public.finance_transactions
  where ledger_entry_group_id = new.ledger_entry_group_id
    and status = 'posted';

  if currency_count > 1 then
    raise exception 'Invalid ledger group %. Posted ledger entries must use one currency.', new.ledger_entry_group_id;
  end if;

  select coalesce(
    sum(
      case
        when direction = 'credit' then amount
        when direction = 'debit' then -amount
      end
    ),
    0
  )
  into ledger_balance
  from public.finance_transactions
  where ledger_entry_group_id = new.ledger_entry_group_id
    and status = 'posted';

  if ledger_balance <> 0 then
    raise exception 'Unbalanced ledger group %. Posted debits and credits must net to zero.', new.ledger_entry_group_id;
  end if;

  return null;
end;
$$;

create or replace function public.read_workflow_entity_state(
  input_entity_type public.workflow_entity_type,
  input_entity_id uuid
)
returns table (
  entity_status text,
  entity_status_version integer
)
language plpgsql
stable
set search_path = public
as $$
begin
  case input_entity_type
    when 'proposal' then
      return query
      select p.status::text, p.status_version
      from public.proposals p
      where p.id = input_entity_id and p.deleted_at is null;
    when 'assignment' then
      return query
      select a.status::text, a.status_version
      from public.assignments a
      where a.id = input_entity_id and a.deleted_at is null;
    when 'shift' then
      return query
      select s.status::text, s.status_version
      from public.shifts s
      where s.id = input_entity_id and s.deleted_at is null;
    when 'payment' then
      return query
      select p.status::text, p.status_version
      from public.payments p
      where p.id = input_entity_id and p.deleted_at is null;
    when 'withdrawal' then
      return query
      select wr.status::text, wr.status_version
      from public.withdrawal_requests wr
      where wr.id = input_entity_id and wr.deleted_at is null;
    when 'kyb' then
      return query
      select kyb.status::text, kyb.status_version
      from public.kyb_records kyb
      where kyb.id = input_entity_id and kyb.deleted_at is null;
    when 'kyc' then
      return query
      select kyc.status::text, kyc.status_version
      from public.kyc_records kyc
      where kyc.id = input_entity_id and kyc.deleted_at is null;
  end case;
end;
$$;

create or replace function public.assert_workflow_transition_pre_sync(
  input_entity_type public.workflow_entity_type,
  input_entity_id uuid,
  input_current_status text,
  input_current_status_version integer,
  input_latest_event_status text,
  input_latest_event_version integer,
  input_expected_from_status text default null,
  input_expected_from_status_version integer default null
)
returns void
language plpgsql
as $$
begin
  if input_current_status is null or input_current_status_version is null then
    raise exception 'Workflow entity not found for transition pre-sync check: % %', input_entity_type, input_entity_id;
  end if;

  if input_latest_event_version is not null and input_current_status_version <> input_latest_event_version then
    raise exception 'Workflow pre-sync drift: current status version % does not match latest event version % for % %',
      input_current_status_version, input_latest_event_version, input_entity_type, input_entity_id;
  end if;

  if input_latest_event_status is not null and input_latest_event_status <> input_current_status then
    raise exception 'Workflow pre-sync drift: current status % does not match latest event status % for % %',
      input_current_status, input_latest_event_status, input_entity_type, input_entity_id;
  end if;

  if input_expected_from_status is not null and input_expected_from_status <> input_current_status then
    raise exception 'Stale workflow transition: expected from_status %, current persisted status % for % %',
      input_expected_from_status, input_current_status, input_entity_type, input_entity_id;
  end if;

  if input_expected_from_status_version is not null and input_expected_from_status_version <> input_current_status_version then
    raise exception 'Stale workflow transition: expected from_status_version %, current persisted status_version % for % %',
      input_expected_from_status_version, input_current_status_version, input_entity_type, input_entity_id;
  end if;
end;
$$;

create or replace function public.assert_workflow_transition_post_sync(
  input_entity_type public.workflow_entity_type,
  input_entity_id uuid,
  input_expected_to_status text,
  input_expected_to_status_version integer
)
returns void
language plpgsql
as $$
declare
  persisted_status text;
  persisted_status_version integer;
begin
  select entity_status, entity_status_version
  into persisted_status, persisted_status_version
  from public.read_workflow_entity_state(input_entity_type, input_entity_id);

  if persisted_status is null then
    raise exception 'Workflow entity not found for transition post-sync check: % %', input_entity_type, input_entity_id;
  end if;

  if persisted_status <> input_expected_to_status or persisted_status_version <> input_expected_to_status_version then
    raise exception 'Workflow post-sync drift: persisted %/% does not match expected %/% for % %',
      persisted_status, persisted_status_version, input_expected_to_status, input_expected_to_status_version, input_entity_type, input_entity_id;
  end if;
end;
$$;

drop view if exists public.workflow_transition_drift;

create or replace view public.workflow_transition_drift
with (security_invoker = true) as
with latest_events as (
  select distinct on (entity_type, entity_id)
    entity_type,
    entity_id,
    to_status,
    to_status_version,
    created_at
  from public.workflow_transition_events
  order by entity_type, entity_id, to_status_version desc, created_at desc
)
select
  'proposal'::public.workflow_entity_type as entity_type,
  p.id as entity_id,
  p.status::text as entity_status,
  p.status_version as entity_status_version,
  le.to_status as latest_event_status,
  le.to_status_version as latest_event_status_version,
  le.created_at as latest_event_at
from public.proposals p
left join latest_events le on le.entity_type = 'proposal' and le.entity_id = p.id
where p.deleted_at is null
  and (le.entity_id is null or p.status::text <> le.to_status or p.status_version <> le.to_status_version)
union all
select
  'assignment'::public.workflow_entity_type,
  a.id,
  a.status::text,
  a.status_version,
  le.to_status,
  le.to_status_version,
  le.created_at
from public.assignments a
left join latest_events le on le.entity_type = 'assignment' and le.entity_id = a.id
where a.deleted_at is null
  and (le.entity_id is null or a.status::text <> le.to_status or a.status_version <> le.to_status_version)
union all
select
  'shift'::public.workflow_entity_type,
  s.id,
  s.status::text,
  s.status_version,
  le.to_status,
  le.to_status_version,
  le.created_at
from public.shifts s
left join latest_events le on le.entity_type = 'shift' and le.entity_id = s.id
where s.deleted_at is null
  and (le.entity_id is null or s.status::text <> le.to_status or s.status_version <> le.to_status_version)
union all
select
  'payment'::public.workflow_entity_type,
  p.id,
  p.status::text,
  p.status_version,
  le.to_status,
  le.to_status_version,
  le.created_at
from public.payments p
left join latest_events le on le.entity_type = 'payment' and le.entity_id = p.id
where p.deleted_at is null
  and (le.entity_id is null or p.status::text <> le.to_status or p.status_version <> le.to_status_version)
union all
select
  'withdrawal'::public.workflow_entity_type,
  wr.id,
  wr.status::text,
  wr.status_version,
  le.to_status,
  le.to_status_version,
  le.created_at
from public.withdrawal_requests wr
left join latest_events le on le.entity_type = 'withdrawal' and le.entity_id = wr.id
where wr.deleted_at is null
  and (le.entity_id is null or wr.status::text <> le.to_status or wr.status_version <> le.to_status_version)
union all
select
  'kyb'::public.workflow_entity_type,
  kyb.id,
  kyb.status::text,
  kyb.status_version,
  le.to_status,
  le.to_status_version,
  le.created_at
from public.kyb_records kyb
left join latest_events le on le.entity_type = 'kyb' and le.entity_id = kyb.id
where kyb.deleted_at is null
  and (le.entity_id is null or kyb.status::text <> le.to_status or kyb.status_version <> le.to_status_version)
union all
select
  'kyc'::public.workflow_entity_type,
  kyc.id,
  kyc.status::text,
  kyc.status_version,
  le.to_status,
  le.to_status_version,
  le.created_at
from public.kyc_records kyc
left join latest_events le on le.entity_type = 'kyc' and le.entity_id = kyc.id
where kyc.deleted_at is null
  and (le.entity_id is null or kyc.status::text <> le.to_status or kyc.status_version <> le.to_status_version);

create or replace function public.guard_workflow_transition_event_insert()
returns trigger
language plpgsql
as $$
declare
  persisted_status text;
  persisted_status_version integer;
  latest_event_version integer;
  latest_event_status text;
begin
  if current_setting('app.workflow_transition_executor', true) is distinct from 'on' then
    raise exception 'Workflow transition events must be written by transition_workflow_entity';
  end if;

  if not exists (
    select 1
    from public.workflow_transition_rules r
    where r.id = new.transition_rule_id
      and r.rule_version = new.transition_rule_version
      and r.entity_type = new.entity_type
      and r.to_status = new.to_status
      and (
        (r.from_status is null and new.from_status is null)
        or r.from_status = new.from_status
      )
      and r.active = true
  ) then
    raise exception 'Invalid workflow transition: % from % to % is not allowed', new.entity_type, new.from_status, new.to_status;
  end if;

  case new.entity_type
    when 'proposal' then
      select p.status::text, p.status_version
      into persisted_status, persisted_status_version
      from public.proposals p
      where p.id = new.entity_id and p.deleted_at is null;
      if persisted_status is null then
        raise exception 'Invalid workflow transition: proposal % does not exist or status does not match transition target', new.entity_id;
      end if;
    when 'assignment' then
      select a.status::text, a.status_version
      into persisted_status, persisted_status_version
      from public.assignments a
      where a.id = new.entity_id and a.deleted_at is null;
      if persisted_status is null then
        raise exception 'Invalid workflow transition: assignment % does not exist or status does not match transition target', new.entity_id;
      end if;
    when 'shift' then
      select s.status::text, s.status_version
      into persisted_status, persisted_status_version
      from public.shifts s
      where s.id = new.entity_id and s.deleted_at is null;
      if persisted_status is null then
        raise exception 'Invalid workflow transition: shift % does not exist or status does not match transition target', new.entity_id;
      end if;
    when 'payment' then
      select p.status::text, p.status_version
      into persisted_status, persisted_status_version
      from public.payments p
      where p.id = new.entity_id and p.deleted_at is null;
      if persisted_status is null then
        raise exception 'Invalid workflow transition: payment % does not exist or status does not match transition target', new.entity_id;
      end if;
    when 'withdrawal' then
      select wr.status::text, wr.status_version
      into persisted_status, persisted_status_version
      from public.withdrawal_requests wr
      where wr.id = new.entity_id and wr.deleted_at is null;
      if persisted_status is null then
        raise exception 'Invalid workflow transition: withdrawal % does not exist or status does not match transition target', new.entity_id;
      end if;
    when 'kyb' then
      select kyb.status::text, kyb.status_version
      into persisted_status, persisted_status_version
      from public.kyb_records kyb
      where kyb.id = new.entity_id and kyb.deleted_at is null;
      if persisted_status is null then
        raise exception 'Invalid workflow transition: KYB record % does not exist or status does not match transition target', new.entity_id;
      end if;
    when 'kyc' then
      select kyc.status::text, kyc.status_version
      into persisted_status, persisted_status_version
      from public.kyc_records kyc
      where kyc.id = new.entity_id and kyc.deleted_at is null;
      if persisted_status is null then
        raise exception 'Invalid workflow transition: KYC record % does not exist or status does not match transition target', new.entity_id;
      end if;
  end case;

  if persisted_status <> new.to_status or persisted_status_version <> new.to_status_version then
    raise exception 'Invalid workflow transition: persisted status/version %/% does not match event target %/%',
      persisted_status, persisted_status_version, new.to_status, new.to_status_version;
  end if;

  select e.to_status, e.to_status_version
  into latest_event_status, latest_event_version
  from public.workflow_transition_events e
  where e.entity_type = new.entity_type
    and e.entity_id = new.entity_id
  order by e.to_status_version desc
  limit 1;

  if new.from_status is null then
    if new.from_status_version is not null or latest_event_version is not null or new.to_status_version <> 0 then
      raise exception 'Invalid initial workflow transition event for % %', new.entity_type, new.entity_id;
    end if;
  else
    if new.from_status_version is null then
      raise exception 'Invalid workflow transition: from_status_version is required for non-initial transitions';
    end if;

    if latest_event_version is null or latest_event_version <> new.from_status_version then
      raise exception 'Invalid workflow transition: latest event version % does not match from_status_version %',
        latest_event_version, new.from_status_version;
    end if;

    if latest_event_status is distinct from new.from_status then
      raise exception 'Invalid workflow transition: latest event status % does not match from_status %',
        latest_event_status, new.from_status;
    end if;

    if new.to_status_version <> new.from_status_version + 1 then
      raise exception 'Invalid workflow transition: to_status_version must equal from_status_version + 1';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.is_workflow_transition_allowed(
  check_entity_type public.workflow_entity_type,
  check_from_status text,
  check_to_status text
)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.workflow_transition_rules r
    where r.entity_type = check_entity_type
      and r.to_status = check_to_status
      and (
        (r.from_status is null and check_from_status is null)
        or r.from_status = check_from_status
      )
      and r.active = true
  )
$$;

create or replace function public.guard_workflow_status_update()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status then
    if current_setting('app.workflow_transition_executor', true) is distinct from 'on' then
      raise exception 'Workflow status changes must use transition_workflow_entity';
    end if;

    new.status_version := old.status_version + 1;
  elsif old.status_version is distinct from new.status_version then
    raise exception 'Workflow status_version cannot change without a status transition';
  end if;

  return new;
end;
$$;

create or replace function public.transition_workflow_entity(
  input_entity_type public.workflow_entity_type,
  input_entity_id uuid,
  input_to_status text,
  input_transition_reason text,
  input_transitioned_by uuid,
  input_transition_source public.workflow_transition_source,
  input_guard_result jsonb default '{}'::jsonb,
  input_metadata jsonb default '{}'::jsonb,
  input_idempotency_key text default null,
  input_correlation_id uuid default null,
  input_expected_from_status text default null,
  input_expected_from_status_version integer default null
)
returns public.workflow_transition_events
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_current_status text;
  locked_current_version integer;
  event_from_status text;
  event_from_version integer;
  persisted_to_version integer;
  selected_rule public.workflow_transition_rules%rowtype;
  final_idempotency_key text;
  final_correlation_id uuid;
  inserted_event public.workflow_transition_events;
  latest_event_status text;
  latest_event_version integer;
  replay_entity_status text;
  replay_entity_status_version integer;
begin
  if input_idempotency_key is null or length(trim(input_idempotency_key)) = 0 then
    raise exception 'Workflow transition idempotency key is required';
  end if;

  final_idempotency_key := input_idempotency_key;
  final_correlation_id := coalesce(input_correlation_id, gen_random_uuid());

  select *
  into inserted_event
  from public.workflow_transition_events existing_event
  where existing_event.idempotency_key = final_idempotency_key;

  if found then
    if inserted_event.entity_type <> input_entity_type
      or inserted_event.entity_id <> input_entity_id
      or inserted_event.to_status <> input_to_status then
      raise exception 'Workflow transition idempotency key collision for key %', final_idempotency_key;
    end if;

    select entity_status, entity_status_version
    into replay_entity_status, replay_entity_status_version
    from public.read_workflow_entity_state(input_entity_type, input_entity_id);

    if replay_entity_status is null then
      raise exception 'Workflow idempotent replay failed: entity % % does not exist', input_entity_type, input_entity_id;
    end if;

    if replay_entity_status <> inserted_event.to_status or replay_entity_status_version <> inserted_event.to_status_version then
      raise exception 'Workflow idempotent replay drift for key %: persisted %/% vs event %/%',
        final_idempotency_key, replay_entity_status, replay_entity_status_version, inserted_event.to_status, inserted_event.to_status_version;
    end if;

    if input_expected_from_status is not null and inserted_event.from_status is distinct from input_expected_from_status then
      raise exception 'Workflow idempotent replay expected_from_status mismatch for key %: expected %, event has %',
        final_idempotency_key, input_expected_from_status, inserted_event.from_status;
    end if;

    if input_expected_from_status_version is not null and inserted_event.from_status_version is distinct from input_expected_from_status_version then
      raise exception 'Workflow idempotent replay expected_from_status_version mismatch for key %: expected %, event has %',
        final_idempotency_key, input_expected_from_status_version, inserted_event.from_status_version;
    end if;

    return inserted_event;
  end if;

  case input_entity_type
    when 'proposal' then
      select status::text, status_version into locked_current_status, locked_current_version
      from public.proposals
      where id = input_entity_id and deleted_at is null
      for update;
    when 'assignment' then
      select status::text, status_version into locked_current_status, locked_current_version
      from public.assignments
      where id = input_entity_id and deleted_at is null
      for update;
    when 'shift' then
      select status::text, status_version into locked_current_status, locked_current_version
      from public.shifts
      where id = input_entity_id and deleted_at is null
      for update;
    when 'payment' then
      select status::text, status_version into locked_current_status, locked_current_version
      from public.payments
      where id = input_entity_id and deleted_at is null
      for update;
    when 'withdrawal' then
      select status::text, status_version into locked_current_status, locked_current_version
      from public.withdrawal_requests
      where id = input_entity_id and deleted_at is null
      for update;
    when 'kyb' then
      select status::text, status_version into locked_current_status, locked_current_version
      from public.kyb_records
      where id = input_entity_id and deleted_at is null
      for update;
    when 'kyc' then
      select status::text, status_version into locked_current_status, locked_current_version
      from public.kyc_records
      where id = input_entity_id and deleted_at is null
      for update;
  end case;

  if locked_current_status is null then
    raise exception 'Workflow entity not found: % %', input_entity_type, input_entity_id;
  end if;

  select e.to_status, e.to_status_version
  into latest_event_status, latest_event_version
  from public.workflow_transition_events e
  where e.entity_type = input_entity_type
    and e.entity_id = input_entity_id
  order by e.to_status_version desc
  limit 1;

  perform public.assert_workflow_transition_pre_sync(
    input_entity_type,
    input_entity_id,
    locked_current_status,
    locked_current_version,
    latest_event_status,
    latest_event_version,
    input_expected_from_status,
    input_expected_from_status_version
  );

  select *
  into selected_rule
  from public.workflow_transition_rules r
  where r.entity_type = input_entity_type
    and r.to_status = input_to_status
    and (
      r.from_status = locked_current_status
      or (
        r.from_status is null
        and locked_current_status = input_to_status
        and not exists (
          select 1
          from public.workflow_transition_events e
          where e.entity_type = input_entity_type
            and e.entity_id = input_entity_id
        )
      )
    )
    and r.active = true
  order by (r.from_status is not null) desc, r.rule_version desc
  limit 1;

  event_from_status := selected_rule.from_status;
  event_from_version := case when selected_rule.from_status is null then null else locked_current_version end;

  if not found then
    raise exception 'Workflow transition is not allowed: % from % to %', input_entity_type, locked_current_status, input_to_status;
  end if;

  -- Pre-transition synchronization validation:
  -- Treat "initial/creation" rules (rule.from_status IS NULL) as originating from
  -- the current persisted status (which must equal input_to_status).
  if coalesce(selected_rule.from_status, input_to_status) <> locked_current_status then
    raise exception 'Workflow pre-transition sync failure: current persisted status % does not match expected from_status % for % %',
      locked_current_status,
      coalesce(selected_rule.from_status, input_to_status),
      input_entity_type,
      input_entity_id;
  end if;

  -- Reject invalid transition sequences when workflow history is missing.
  -- Non-initial transitions require an existing latest workflow event.
  if selected_rule.from_status is not null and latest_event_version is null then
    raise exception 'Stale workflow transition: non-initial transition % -> % requires prior workflow event history for % %',
      selected_rule.from_status, input_to_status, input_entity_type, input_entity_id;
  end if;

  -- Initial transitions require that workflow history is empty.
  if selected_rule.from_status is null and latest_event_version is not null then
    raise exception 'Invalid workflow transition sequence: initial transition requires missing workflow event history for % %',
      input_entity_type, input_entity_id;
  end if;

  if selected_rule.from_status is not null and selected_rule.from_status <> locked_current_status then
    raise exception 'Workflow entity status changed during transition: expected %, found %', selected_rule.from_status, locked_current_status;
  end if;

  if selected_rule.from_status is null and locked_current_status <> input_to_status then
    raise exception 'Initial workflow transition requires current status to equal target status: found %, target %', locked_current_status, input_to_status;
  end if;

  if coalesce((input_guard_result ->> 'passed')::boolean, false) is not true then
    raise exception 'Workflow guard evaluation failed or missing for transition % from % to %', input_entity_type, event_from_status, input_to_status;
  end if;

  perform set_config('app.workflow_transition_executor', 'on', true);

  if selected_rule.from_status is not null then
    case input_entity_type
      when 'proposal' then
        update public.proposals set status = input_to_status::public.proposal_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'assignment' then
        update public.assignments set status = input_to_status::public.assignment_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'shift' then
        update public.shifts set status = input_to_status::public.shift_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'payment' then
        update public.payments set status = input_to_status::public.payment_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'withdrawal' then
        update public.withdrawal_requests set status = input_to_status::public.withdrawal_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'kyb' then
        update public.kyb_records set status = input_to_status::public.verification_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'kyc' then
        update public.kyc_records set status = input_to_status::public.verification_status where id = input_entity_id returning status_version into persisted_to_version;
    end case;
  else
    persisted_to_version := locked_current_version;
  end if;

  insert into public.workflow_transition_events (
    transition_rule_id,
    transition_rule_version,
    entity_type,
    entity_id,
    from_status,
    from_status_version,
    to_status,
    to_status_version,
    transition_reason,
    transitioned_by,
    transition_source,
    idempotency_key,
    correlation_id,
    realtime_topic,
    guard_result,
    metadata
  ) values (
    selected_rule.id,
    selected_rule.rule_version,
    input_entity_type,
    input_entity_id,
    event_from_status,
    event_from_version,
    input_to_status,
    persisted_to_version,
    input_transition_reason,
    input_transitioned_by,
    input_transition_source,
    final_idempotency_key,
    final_correlation_id,
    selected_rule.realtime_topic,
    input_guard_result,
    input_metadata
  )
  returning * into inserted_event;

  insert into public.audit_logs (
    auth_account_id,
    action,
    domain,
    entity_table,
    entity_id,
    before_state,
    after_state,
    metadata
  ) values (
    input_transitioned_by,
    'status_change',
    'workflow',
    input_entity_type::text,
    input_entity_id,
    jsonb_build_object('status', event_from_status, 'status_version', event_from_version),
    jsonb_build_object('status', input_to_status, 'status_version', persisted_to_version),
    jsonb_build_object(
      'workflow_event_id', inserted_event.workflow_event_id,
      'transition_rule_id', selected_rule.id,
      'transition_rule_version', selected_rule.rule_version,
      'correlation_id', final_correlation_id,
      'transition_source', input_transition_source,
      'guard_result', input_guard_result
    )
  );

  insert into public.workflow_event_outbox (
    workflow_event_id,
    topic,
    payload
  ) values (
    inserted_event.workflow_event_id,
    coalesce(inserted_event.realtime_topic, 'workflow.events'),
    jsonb_build_object(
      'workflow_event_id', inserted_event.workflow_event_id,
      'entity_type', inserted_event.entity_type,
      'entity_id', inserted_event.entity_id,
      'from_status', inserted_event.from_status,
      'from_status_version', inserted_event.from_status_version,
      'to_status', inserted_event.to_status,
      'to_status_version', inserted_event.to_status_version,
      'transition_rule_id', inserted_event.transition_rule_id,
      'transition_rule_version', inserted_event.transition_rule_version,
      'correlation_id', inserted_event.correlation_id,
      'transition_source', inserted_event.transition_source,
      'created_at', inserted_event.created_at
    )
  );

  perform public.assert_workflow_transition_post_sync(
    input_entity_type,
    input_entity_id,
    inserted_event.to_status,
    inserted_event.to_status_version
  );

  return inserted_event;
end;
$$;

create or replace function public.prevent_workflow_transition_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'workflow_transition_events are immutable. Append a recovery transition instead of update/delete.';
end;
$$;

create trigger guard_proposal_chain_before_write before insert or update on public.proposals for each row execute function public.guard_proposal_chain();
create trigger guard_assignment_chain_before_write before insert or update on public.assignments for each row execute function public.guard_assignment_chain();
create trigger guard_shift_chain_before_write before insert or update on public.shifts for each row execute function public.guard_shift_chain();
create trigger guard_payment_chain_before_write before insert or update on public.payments for each row execute function public.guard_payment_chain();
create trigger guard_withdrawal_chain_before_write before insert or update on public.withdrawal_requests for each row execute function public.guard_withdrawal_chain();
create trigger guard_proposal_status_update before update on public.proposals for each row execute function public.guard_workflow_status_update();
create trigger guard_assignment_status_update before update on public.assignments for each row execute function public.guard_workflow_status_update();
create trigger guard_shift_status_update before update on public.shifts for each row execute function public.guard_workflow_status_update();
create trigger guard_payment_status_update before update on public.payments for each row execute function public.guard_workflow_status_update();
create trigger guard_withdrawal_status_update before update on public.withdrawal_requests for each row execute function public.guard_workflow_status_update();
create trigger guard_kyb_status_update before update on public.kyb_records for each row execute function public.guard_workflow_status_update();
create trigger guard_kyc_status_update before update on public.kyc_records for each row execute function public.guard_workflow_status_update();
create trigger guard_finance_transaction_insert_before_write before insert on public.finance_transactions for each row execute function public.guard_finance_transaction_insert();
create trigger prevent_finance_transaction_update before update on public.finance_transactions for each row execute function public.prevent_finance_transaction_mutation();
create trigger prevent_finance_transaction_delete before delete on public.finance_transactions for each row execute function public.prevent_finance_transaction_mutation();
create constraint trigger guard_ledger_group_balanced_after_insert
after insert on public.finance_transactions
deferrable initially deferred
for each row execute function public.guard_ledger_group_balanced();
create trigger guard_workflow_transition_event_insert_before_write before insert on public.workflow_transition_events for each row execute function public.guard_workflow_transition_event_insert();
create trigger prevent_workflow_transition_event_update before update on public.workflow_transition_events for each row execute function public.prevent_workflow_transition_event_mutation();
create trigger prevent_workflow_transition_event_delete before delete on public.workflow_transition_events for each row execute function public.prevent_workflow_transition_event_mutation();

revoke execute on function public.transition_workflow_entity(
  public.workflow_entity_type,
  uuid,
  text,
  text,
  uuid,
  public.workflow_transition_source,
  jsonb,
  jsonb,
  text,
  uuid,
  text,
  integer
) from anon, authenticated;

-- Uniqueness and lookup indexes
create unique index auth_accounts_email_active_uidx on public.auth_accounts (lower(email)) where deleted_at is null;
create unique index auth_accounts_provider_subject_uidx on public.auth_accounts (provider, provider_subject) where provider_subject is not null and deleted_at is null;
create unique index sessions_token_hash_uidx on public.sessions (session_token_hash) where deleted_at is null;
create unique index email_verifications_token_hash_uidx on public.email_verifications (token_hash) where deleted_at is null;
create unique index saved_jobs_unique_active_uidx on public.saved_jobs (crew_user_id, job_id) where deleted_at is null;
create unique index proposals_job_crew_active_uidx on public.proposals (job_id, crew_user_id) where deleted_at is null;
create unique index payout_methods_default_uidx on public.payout_methods (crew_user_id) where is_default = true and deleted_at is null;
create unique index withdrawal_requests_payment_active_uidx on public.withdrawal_requests (payment_id) where deleted_at is null and status not in ('rejected', 'cancelled');
create unique index finance_transactions_idempotency_uidx on public.finance_transactions (idempotency_key);
create unique index workflow_transition_rules_active_uidx on public.workflow_transition_rules (entity_type, coalesce(from_status, '__initial__'), to_status) where active = true;
create unique index workflow_transition_events_idempotency_uidx on public.workflow_transition_events (idempotency_key);

-- Foreign-key and workflow indexes
create index auth_accounts_status_idx on public.auth_accounts (status) where deleted_at is null;
create index business_users_auth_account_idx on public.business_users (auth_account_id) where deleted_at is null;
create index company_profiles_owner_idx on public.company_profiles (owner_business_user_id) where deleted_at is null;
create index company_profiles_status_idx on public.company_profiles (status) where deleted_at is null;
create index crew_users_auth_account_idx on public.crew_users (auth_account_id) where deleted_at is null;
create index crew_profiles_marketplace_ready_idx on public.crew_profiles (marketplace_ready, profile_published) where deleted_at is null;
create index crew_skills_user_skill_idx on public.crew_skills (crew_user_id, lower(skill_name)) where deleted_at is null;
create index events_company_status_idx on public.events (company_profile_id, status) where deleted_at is null;
create index events_schedule_idx on public.events (starts_at, ends_at) where deleted_at is null;
create index jobs_event_status_idx on public.jobs (event_id, status) where deleted_at is null;
create index jobs_company_status_idx on public.jobs (company_profile_id, status) where deleted_at is null;
create index job_skills_job_idx on public.job_skills (job_id) where deleted_at is null;
create index proposals_job_status_idx on public.proposals (job_id, status) where deleted_at is null;
create index proposals_chain_idx on public.proposals (job_id, event_id, company_profile_id, crew_user_id) where deleted_at is null;
create index proposals_crew_status_idx on public.proposals (crew_user_id, status) where deleted_at is null;
create index assignments_proposal_idx on public.assignments (proposal_id) where deleted_at is null;
create index assignments_chain_idx on public.assignments (proposal_id, job_id, event_id, company_profile_id, crew_user_id) where deleted_at is null;
create index assignments_job_status_idx on public.assignments (job_id, status) where deleted_at is null;
create index assignments_crew_status_idx on public.assignments (crew_user_id, status) where deleted_at is null;
create index shifts_assignment_status_idx on public.shifts (assignment_id, status) where deleted_at is null;
create index shifts_chain_idx on public.shifts (assignment_id, event_id, job_id, company_profile_id, crew_user_id) where deleted_at is null;
create index shifts_crew_schedule_idx on public.shifts (crew_user_id, starts_at) where deleted_at is null;
create index attendance_shift_status_idx on public.attendance_verifications (shift_id, status) where deleted_at is null;
create index incidents_status_severity_idx on public.operational_incidents (status, severity) where deleted_at is null;
create index payments_assignment_status_idx on public.payments (assignment_id, status) where deleted_at is null;
create index payments_chain_idx on public.payments (assignment_id, company_profile_id, crew_user_id, status) where deleted_at is null;
create index payments_crew_status_idx on public.payments (crew_user_id, status) where deleted_at is null;
create index escrow_payment_status_idx on public.escrow_records (payment_id, status) where deleted_at is null;
create index refunds_payment_status_idx on public.refunds (payment_id, status) where deleted_at is null;
create index withdrawals_crew_status_idx on public.withdrawal_requests (crew_user_id, status) where deleted_at is null;
create index withdrawals_chain_idx on public.withdrawal_requests (payment_id, company_profile_id, crew_user_id, status) where deleted_at is null;
create index finance_transactions_payment_idx on public.finance_transactions (payment_id) where deleted_at is null;
create index finance_transactions_group_idx on public.finance_transactions (ledger_entry_group_id, entry_sequence);
create index finance_transactions_ledger_account_idx on public.finance_transactions (ledger_account, currency, created_at desc);
create index finance_transactions_crew_idx on public.finance_transactions (crew_user_id, created_at desc) where deleted_at is null;
create index finance_transactions_withdrawal_idx on public.finance_transactions (withdrawal_request_id, created_at desc) where withdrawal_request_id is not null;
create index finance_transactions_refund_idx on public.finance_transactions (refund_id, created_at desc) where refund_id is not null;
create index workflow_transition_rules_entity_idx on public.workflow_transition_rules (entity_type, from_status, to_status) where active = true;
create index workflow_transition_events_entity_idx on public.workflow_transition_events (entity_type, entity_id, created_at desc);
create unique index workflow_transition_events_entity_version_uidx on public.workflow_transition_events (entity_type, entity_id, to_status_version);
create index workflow_transition_events_correlation_idx on public.workflow_transition_events (correlation_id, created_at desc);
create index workflow_transition_events_rule_idx on public.workflow_transition_events (transition_rule_id, transition_rule_version, created_at desc);
create index workflow_transition_events_realtime_idx on public.workflow_transition_events (realtime_topic, created_at desc) where realtime_topic is not null;
create index workflow_transition_events_actor_idx on public.workflow_transition_events (transitioned_by, created_at desc) where transitioned_by is not null;
create index workflow_transition_events_source_idx on public.workflow_transition_events (transition_source, created_at desc);
create index workflow_event_outbox_pending_idx on public.workflow_event_outbox (status, next_attempt_at, created_at) where status in ('pending', 'failed') and deleted_at is null;
create index workflow_event_outbox_topic_idx on public.workflow_event_outbox (topic, created_at desc) where deleted_at is null;
create index audit_logs_entity_idx on public.audit_logs (entity_table, entity_id, created_at desc);
create index audit_logs_domain_idx on public.audit_logs (domain, created_at desc);
create index kyb_records_metadata_gin_idx on public.kyb_records using gin (metadata);
create index kyc_records_metadata_gin_idx on public.kyc_records using gin (metadata);
create index finance_transactions_metadata_gin_idx on public.finance_transactions using gin (metadata);

create view public.crew_wallet_balances
with (security_invoker = true) as
select
  crew_user_id,
  currency,
  coalesce(
    sum(amount) filter (where ledger_account = 'crew_wallet_available' and direction = 'credit' and status = 'posted'),
    0
  )
  - coalesce(
    sum(amount) filter (where ledger_account = 'crew_wallet_available' and direction = 'debit' and status = 'posted'),
    0
  ) as available_balance,
  coalesce(
    sum(amount) filter (where ledger_account = 'crew_wallet_pending' and direction = 'credit' and status = 'posted'),
    0
  )
  - coalesce(
    sum(amount) filter (where ledger_account = 'crew_wallet_pending' and direction = 'debit' and status = 'posted'),
    0
  ) as pending_balance,
  coalesce(
    sum(amount) filter (
      where ledger_account in ('crew_wallet_pending', 'crew_wallet_available')
        and direction = 'credit'
        -- Payment-release credits into crew wallet accounts are represented by `escrow_release`
        -- (and separate `wallet_credit` entries for non-escrow wallet credits).
        and transaction_type in ('escrow_release', 'wallet_credit')
        and status = 'posted'
    ),
    0
  ) as lifetime_earnings,
  max(created_at) as last_ledger_entry_at
from public.finance_transactions
where crew_user_id is not null
  and deleted_at is null
group by crew_user_id, currency;

-- Centralized workflow transition maps
insert into public.workflow_transition_rules (
  entity_type,
  from_status,
  to_status,
  transition_name,
  guard_keys,
  requires_service_role,
  is_terminal,
  realtime_topic,
  sort_order
) values
  ('proposal', null, 'applied', 'create_proposal', array['job_open', 'crew_marketplace_ready'], true, false, 'workflow.proposals', 10),
  ('proposal', 'applied', 'offer_sent', 'send_offer', array['business_owns_job', 'proposal_active'], true, false, 'workflow.proposals', 20),
  ('proposal', 'applied', 'declined', 'decline_application', array['business_owns_job'], true, true, 'workflow.proposals', 30),
  ('proposal', 'applied', 'withdrawn', 'withdraw_application', array['crew_owns_proposal'], true, true, 'workflow.proposals', 40),
  ('proposal', 'offer_sent', 'offer_accepted', 'accept_offer', array['crew_owns_proposal', 'offer_valid'], true, false, 'workflow.proposals', 50),
  ('proposal', 'offer_sent', 'declined', 'decline_offer', array['crew_owns_proposal'], true, true, 'workflow.proposals', 60),
  ('proposal', 'offer_sent', 'withdrawn', 'withdraw_after_offer', array['crew_owns_proposal'], true, true, 'workflow.proposals', 70),
  ('proposal', 'offer_accepted', 'hired', 'confirm_hire', array['business_owns_job', 'payment_authorized'], true, true, 'workflow.proposals', 80),
  ('proposal', 'offer_accepted', 'withdrawn', 'withdraw_before_hire', array['crew_owns_proposal'], true, true, 'workflow.proposals', 90),

  ('assignment', null, 'scheduled', 'create_assignment', array['proposal_hired', 'payment_authorized'], true, false, 'workflow.assignments', 100),
  ('assignment', 'scheduled', 'active', 'activate_assignment', array['assignment_ready', 'event_open'], true, false, 'workflow.assignments', 110),
  ('assignment', 'scheduled', 'cancelled', 'cancel_scheduled_assignment', array['business_or_admin_authorized'], true, true, 'workflow.assignments', 120),
  ('assignment', 'active', 'completed', 'complete_assignment', array['all_shifts_closed', 'attendance_validated'], true, true, 'workflow.assignments', 130),
  ('assignment', 'active', 'cancelled', 'cancel_active_assignment', array['business_or_admin_authorized', 'payment_reversal_ready'], true, true, 'workflow.assignments', 140),

  ('shift', null, 'scheduled', 'create_shift', array['assignment_not_cancelled'], true, false, 'workflow.shifts', 200),
  ('shift', 'scheduled', 'checked_in', 'check_in', array['attendance_window_open', 'qr_or_supervisor_verified'], true, false, 'workflow.shifts', 210),
  ('shift', 'scheduled', 'no_show', 'mark_no_show', array['attendance_window_expired'], true, true, 'workflow.shifts', 220),
  ('shift', 'scheduled', 'cancelled', 'cancel_shift', array['business_or_admin_authorized'], true, true, 'workflow.shifts', 230),
  ('shift', 'checked_in', 'in_progress', 'start_shift_work', array['check_in_verified'], true, false, 'workflow.shifts', 240),
  ('shift', 'checked_in', 'cancelled', 'cancel_checked_in_shift', array['supervisor_or_admin_authorized'], true, true, 'workflow.shifts', 250),
  ('shift', 'in_progress', 'completed', 'complete_shift', array['checkout_verified', 'supervisor_confirmation'], true, true, 'workflow.shifts', 260),
  ('shift', 'in_progress', 'cancelled', 'cancel_in_progress_shift', array['admin_authorized', 'incident_recorded'], true, true, 'workflow.shifts', 270),

  ('payment', null, 'pending', 'create_payment', array['assignment_created'], true, false, 'workflow.payments', 300),
  ('payment', 'pending', 'authorized', 'authorize_payment', array['business_payment_method_valid'], true, false, 'workflow.payments', 310),
  ('payment', 'pending', 'failed', 'payment_authorization_failed', array['provider_failure_recorded'], true, true, 'workflow.payments', 320),
  ('payment', 'pending', 'cancelled', 'cancel_pending_payment', array['assignment_cancelled_or_admin'], true, true, 'workflow.payments', 330),
  ('payment', 'authorized', 'funded', 'fund_escrow', array['escrow_funded', 'ledger_group_balanced'], true, false, 'workflow.payments', 340),
  ('payment', 'authorized', 'failed', 'funding_failed', array['provider_failure_recorded'], true, true, 'workflow.payments', 350),
  ('payment', 'authorized', 'cancelled', 'cancel_authorized_payment', array['escrow_not_funded'], true, true, 'workflow.payments', 360),
  ('payment', 'funded', 'released', 'release_payment', array['shift_completed', 'attendance_validated', 'ledger_group_balanced'], true, true, 'workflow.payments', 370),
  ('payment', 'funded', 'refunded', 'refund_funded_payment', array['refund_approved', 'ledger_group_balanced'], true, true, 'workflow.payments', 380),
  ('payment', 'released', 'refunded', 'refund_released_payment', array['dispute_approved', 'ledger_reversal_created'], true, true, 'workflow.payments', 390),

  ('withdrawal', null, 'requested', 'request_withdrawal', array['wallet_available_balance_sufficient', 'payout_method_verified'], true, false, 'workflow.withdrawals', 400),
  ('withdrawal', 'requested', 'under_review', 'review_withdrawal', array['risk_screen_required'], true, false, 'workflow.withdrawals', 410),
  ('withdrawal', 'requested', 'approved', 'approve_low_risk_withdrawal', array['risk_screen_passed', 'ledger_reservation_created'], true, false, 'workflow.withdrawals', 420),
  ('withdrawal', 'requested', 'rejected', 'reject_requested_withdrawal', array['risk_screen_failed'], true, true, 'workflow.withdrawals', 430),
  ('withdrawal', 'requested', 'cancelled', 'cancel_requested_withdrawal', array['crew_owns_withdrawal'], true, true, 'workflow.withdrawals', 440),
  ('withdrawal', 'under_review', 'approved', 'approve_reviewed_withdrawal', array['risk_screen_passed', 'ledger_reservation_created'], true, false, 'workflow.withdrawals', 450),
  ('withdrawal', 'under_review', 'rejected', 'reject_reviewed_withdrawal', array['risk_screen_failed', 'ledger_reservation_reversed'], true, true, 'workflow.withdrawals', 460),
  ('withdrawal', 'under_review', 'cancelled', 'cancel_reviewed_withdrawal', array['admin_or_crew_authorized', 'ledger_reservation_reversed'], true, true, 'workflow.withdrawals', 470),
  ('withdrawal', 'approved', 'processing', 'process_withdrawal', array['provider_payout_created'], true, false, 'workflow.withdrawals', 480),
  ('withdrawal', 'approved', 'rejected', 'reject_approved_withdrawal', array['provider_rejected', 'ledger_reservation_reversed'], true, true, 'workflow.withdrawals', 490),
  ('withdrawal', 'approved', 'cancelled', 'cancel_approved_withdrawal', array['admin_authorized', 'ledger_reservation_reversed'], true, true, 'workflow.withdrawals', 500),
  ('withdrawal', 'processing', 'paid', 'mark_withdrawal_paid', array['provider_payout_confirmed', 'ledger_payout_posted'], true, true, 'workflow.withdrawals', 510),
  ('withdrawal', 'processing', 'rejected', 'mark_withdrawal_failed', array['provider_payout_failed', 'ledger_reservation_reversed'], true, true, 'workflow.withdrawals', 520),

  ('kyb', null, 'pending', 'create_kyb_record', array['company_exists'], true, false, 'workflow.verification', 600),
  ('kyb', 'pending', 'submitted', 'submit_kyb', array['documents_attached'], true, false, 'workflow.verification', 610),
  ('kyb', 'pending', 'expired', 'expire_unsubmitted_kyb', array['deadline_expired'], true, true, 'workflow.verification', 620),
  ('kyb', 'submitted', 'approved', 'approve_kyb', array['provider_approved'], true, true, 'workflow.verification', 630),
  ('kyb', 'submitted', 'additional_info_requested', 'request_kyb_information', array['provider_requested_info'], true, false, 'workflow.verification', 640),
  ('kyb', 'submitted', 'rejected', 'reject_kyb', array['provider_rejected'], true, true, 'workflow.verification', 650),
  ('kyb', 'submitted', 'expired', 'expire_submitted_kyb', array['provider_deadline_expired'], true, true, 'workflow.verification', 660),
  ('kyb', 'approved', 'revoked', 'revoke_kyb', array['compliance_review_failed'], true, true, 'workflow.verification', 670),
  ('kyb', 'additional_info_requested', 'submitted', 'resubmit_kyb', array['additional_info_uploaded'], true, false, 'workflow.verification', 680),
  ('kyb', 'rejected', 'submitted', 'retry_kyb', array['retry_allowed'], true, false, 'workflow.verification', 690),

  ('kyc', null, 'pending', 'create_kyc_record', array['crew_exists'], true, false, 'workflow.verification', 700),
  ('kyc', 'pending', 'submitted', 'submit_kyc', array['documents_attached'], true, false, 'workflow.verification', 710),
  ('kyc', 'pending', 'expired', 'expire_unsubmitted_kyc', array['deadline_expired'], true, true, 'workflow.verification', 720),
  ('kyc', 'submitted', 'approved', 'approve_kyc', array['provider_approved'], true, true, 'workflow.verification', 730),
  ('kyc', 'submitted', 'additional_info_requested', 'request_kyc_information', array['provider_requested_info'], true, false, 'workflow.verification', 740),
  ('kyc', 'submitted', 'rejected', 'reject_kyc', array['provider_rejected'], true, true, 'workflow.verification', 750),
  ('kyc', 'submitted', 'expired', 'expire_submitted_kyc', array['provider_deadline_expired'], true, true, 'workflow.verification', 760),
  ('kyc', 'approved', 'revoked', 'revoke_kyc', array['compliance_review_failed'], true, true, 'workflow.verification', 770),
  ('kyc', 'additional_info_requested', 'submitted', 'resubmit_kyc', array['additional_info_uploaded'], true, false, 'workflow.verification', 780),
  ('kyc', 'rejected', 'submitted', 'retry_kyc', array['retry_allowed'], true, false, 'workflow.verification', 790);

-- Supabase RLS helpers
create or replace function public.current_auth_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.auth_accounts
  where auth_user_id = auth.uid()
    and deleted_at is null
  limit 1
$$;

create or replace function public.current_business_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.business_users
  where auth_account_id = public.current_auth_account_id()
    and deleted_at is null
  limit 1
$$;

create or replace function public.current_crew_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.crew_users
  where auth_account_id = public.current_auth_account_id()
    and deleted_at is null
  limit 1
$$;

-- Enable RLS
alter table public.auth_accounts enable row level security;
alter table public.email_verifications enable row level security;
alter table public.sessions enable row level security;
alter table public.business_users enable row level security;
alter table public.company_profiles enable row level security;
alter table public.business_finance_records enable row level security;
alter table public.kyb_records enable row level security;
alter table public.crew_users enable row level security;
alter table public.crew_profiles enable row level security;
alter table public.crew_skills enable row level security;
alter table public.crew_experience enable row level security;
alter table public.crew_finance_records enable row level security;
alter table public.crew_wallets enable row level security;
alter table public.kyc_records enable row level security;
alter table public.events enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_terms enable row level security;
alter table public.proposal_attachments enable row level security;
alter table public.assignments enable row level security;
alter table public.shifts enable row level security;
alter table public.attendance_verifications enable row level security;
alter table public.operational_incidents enable row level security;
alter table public.payments enable row level security;
alter table public.escrow_records enable row level security;
alter table public.refunds enable row level security;
alter table public.payout_methods enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.workflow_transition_rules enable row level security;
alter table public.workflow_transition_events enable row level security;
alter table public.workflow_event_outbox enable row level security;
alter table public.audit_logs enable row level security;

-- Baseline RLS policies. Service-role backend code should own writes for transactional workflows.
create policy auth_accounts_self_select on public.auth_accounts
for select using (id = public.current_auth_account_id() and deleted_at is null);

create policy business_users_self_select on public.business_users
for select using (id = public.current_business_user_id() and deleted_at is null);

create policy crew_users_self_select on public.crew_users
for select using (id = public.current_crew_user_id() and deleted_at is null);

create policy company_profiles_owner_select on public.company_profiles
for select using (owner_business_user_id = public.current_business_user_id() and deleted_at is null);

create policy business_finance_owner_select on public.business_finance_records
for select using (
  exists (
    select 1 from public.company_profiles cp
    where cp.id = business_finance_records.company_profile_id
      and cp.owner_business_user_id = public.current_business_user_id()
      and cp.deleted_at is null
  )
  and deleted_at is null
);

create policy kyb_owner_select on public.kyb_records
for select using (
  exists (
    select 1 from public.company_profiles cp
    where cp.id = kyb_records.company_profile_id
      and cp.owner_business_user_id = public.current_business_user_id()
      and cp.deleted_at is null
  )
  and deleted_at is null
);

create policy crew_profile_self_select on public.crew_profiles
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy crew_profile_public_marketplace_select on public.crew_profiles
for select using (marketplace_ready = true and profile_published = true and deleted_at is null);

create policy crew_skills_self_select on public.crew_skills
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy crew_experience_self_select on public.crew_experience
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy crew_finance_self_select on public.crew_finance_records
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy crew_wallet_self_select on public.crew_wallets
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy kyc_self_select on public.kyc_records
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy events_business_owner_select on public.events
for select using (
  exists (
    select 1 from public.company_profiles cp
    where cp.id = events.company_profile_id
      and cp.owner_business_user_id = public.current_business_user_id()
      and cp.deleted_at is null
  )
  and deleted_at is null
);

create policy jobs_business_owner_select on public.jobs
for select using (
  exists (
    select 1 from public.company_profiles cp
    where cp.id = jobs.company_profile_id
      and cp.owner_business_user_id = public.current_business_user_id()
      and cp.deleted_at is null
  )
  and deleted_at is null
);

create policy jobs_crew_open_select on public.jobs
for select using (status in ('open', 'reviewing') and deleted_at is null);

create policy saved_jobs_crew_select on public.saved_jobs
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy proposals_crew_select on public.proposals
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy proposals_business_owner_select on public.proposals
for select using (
  exists (
    select 1
    from public.jobs j
    join public.company_profiles cp on cp.id = j.company_profile_id
    where j.id = proposals.job_id
      and cp.owner_business_user_id = public.current_business_user_id()
      and j.deleted_at is null
      and cp.deleted_at is null
  )
  and deleted_at is null
);

create policy assignments_crew_select on public.assignments
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy assignments_business_owner_select on public.assignments
for select using (
  exists (
    select 1 from public.company_profiles cp
    where cp.id = assignments.company_profile_id
      and cp.owner_business_user_id = public.current_business_user_id()
      and cp.deleted_at is null
  )
  and deleted_at is null
);

create policy shifts_crew_select on public.shifts
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy shifts_business_supervisor_select on public.shifts
for select using (supervisor_business_user_id = public.current_business_user_id() and deleted_at is null);

create policy payments_crew_select on public.payments
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy payments_business_owner_select on public.payments
for select using (
  exists (
    select 1 from public.company_profiles cp
    where cp.id = payments.company_profile_id
      and cp.owner_business_user_id = public.current_business_user_id()
      and cp.deleted_at is null
  )
  and deleted_at is null
);

create policy payout_methods_crew_select on public.payout_methods
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy withdrawal_requests_crew_select on public.withdrawal_requests
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy finance_transactions_crew_select on public.finance_transactions
for select using (crew_user_id = public.current_crew_user_id() and deleted_at is null);

create policy finance_transactions_business_owner_select on public.finance_transactions
for select using (
  exists (
    select 1 from public.company_profiles cp
    where cp.id = finance_transactions.company_profile_id
      and cp.owner_business_user_id = public.current_business_user_id()
      and cp.deleted_at is null
  )
  and deleted_at is null
);

create policy workflow_transition_rules_read on public.workflow_transition_rules
for select using (active = true);

create policy workflow_transition_events_crew_select on public.workflow_transition_events
for select using (
  (
    entity_type = 'proposal'
    and exists (select 1 from public.proposals p where p.id = entity_id and p.crew_user_id = public.current_crew_user_id() and p.deleted_at is null)
  )
  or (
    entity_type = 'assignment'
    and exists (select 1 from public.assignments a where a.id = entity_id and a.crew_user_id = public.current_crew_user_id() and a.deleted_at is null)
  )
  or (
    entity_type = 'shift'
    and exists (select 1 from public.shifts s where s.id = entity_id and s.crew_user_id = public.current_crew_user_id() and s.deleted_at is null)
  )
  or (
    entity_type = 'payment'
    and exists (select 1 from public.payments p where p.id = entity_id and p.crew_user_id = public.current_crew_user_id() and p.deleted_at is null)
  )
  or (
    entity_type = 'withdrawal'
    and exists (select 1 from public.withdrawal_requests wr where wr.id = entity_id and wr.crew_user_id = public.current_crew_user_id() and wr.deleted_at is null)
  )
  or (
    entity_type = 'kyc'
    and exists (select 1 from public.kyc_records kyc where kyc.id = entity_id and kyc.crew_user_id = public.current_crew_user_id() and kyc.deleted_at is null)
  )
);

create policy workflow_transition_events_business_owner_select on public.workflow_transition_events
for select using (
  (
    entity_type = 'proposal'
    and exists (
      select 1
      from public.proposals p
      join public.jobs j on j.id = p.job_id
      join public.company_profiles cp on cp.id = j.company_profile_id
      where p.id = entity_id
        and cp.owner_business_user_id = public.current_business_user_id()
        and p.deleted_at is null
        and j.deleted_at is null
        and cp.deleted_at is null
    )
  )
  or (
    entity_type = 'assignment'
    and exists (
      select 1 from public.assignments a
      join public.company_profiles cp on cp.id = a.company_profile_id
      where a.id = entity_id
        and cp.owner_business_user_id = public.current_business_user_id()
        and a.deleted_at is null
        and cp.deleted_at is null
    )
  )
  or (
    entity_type = 'shift'
    and exists (
      select 1 from public.shifts s
      join public.company_profiles cp on cp.id = s.company_profile_id
      where s.id = entity_id
        and cp.owner_business_user_id = public.current_business_user_id()
        and s.deleted_at is null
        and cp.deleted_at is null
    )
  )
  or (
    entity_type = 'payment'
    and exists (
      select 1 from public.payments p
      join public.company_profiles cp on cp.id = p.company_profile_id
      where p.id = entity_id
        and cp.owner_business_user_id = public.current_business_user_id()
        and p.deleted_at is null
        and cp.deleted_at is null
    )
  )
  or (
    entity_type = 'withdrawal'
    and exists (
      select 1 from public.withdrawal_requests wr
      join public.company_profiles cp on cp.id = wr.company_profile_id
      where wr.id = entity_id
        and cp.owner_business_user_id = public.current_business_user_id()
        and wr.deleted_at is null
        and cp.deleted_at is null
    )
  )
  or (
    entity_type = 'kyb'
    and exists (
      select 1 from public.kyb_records kyb
      join public.company_profiles cp on cp.id = kyb.company_profile_id
      where kyb.id = entity_id
        and cp.owner_business_user_id = public.current_business_user_id()
        and kyb.deleted_at is null
        and cp.deleted_at is null
    )
  )
);
