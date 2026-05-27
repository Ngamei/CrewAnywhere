-- Workflow Status/Event Synchronization Enforcement
-- Adds strict pre/post synchronization checks, replay drift protection,
-- and operational drift detection for workflow entities.

drop function if exists public.transition_workflow_entity(
  public.workflow_entity_type,
  uuid,
  text,
  text,
  uuid,
  public.workflow_transition_source,
  jsonb,
  jsonb,
  text,
  uuid
);

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
      return query select p.status::text, p.status_version from public.proposals p where p.id = input_entity_id and p.deleted_at is null;
    when 'assignment' then
      return query select a.status::text, a.status_version from public.assignments a where a.id = input_entity_id and a.deleted_at is null;
    when 'shift' then
      return query select s.status::text, s.status_version from public.shifts s where s.id = input_entity_id and s.deleted_at is null;
    when 'payment' then
      return query select p.status::text, p.status_version from public.payments p where p.id = input_entity_id and p.deleted_at is null;
    when 'withdrawal' then
      return query select wr.status::text, wr.status_version from public.withdrawal_requests wr where wr.id = input_entity_id and wr.deleted_at is null;
    when 'kyb' then
      return query select kyb.status::text, kyb.status_version from public.kyb_records kyb where kyb.id = input_entity_id and kyb.deleted_at is null;
    when 'kyc' then
      return query select kyc.status::text, kyc.status_version from public.kyc_records kyc where kyc.id = input_entity_id and kyc.deleted_at is null;
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

  if input_latest_event_version is null and input_current_status_version <> 0 then
    raise exception 'Workflow pre-sync drift: missing workflow history for % % with non-zero status_version %',
      input_entity_type, input_entity_id, input_current_status_version;
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
  latest_event_status text;
  latest_event_version integer;
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

  select e.to_status, e.to_status_version
  into latest_event_status, latest_event_version
  from public.workflow_transition_events e
  where e.entity_type = input_entity_type
    and e.entity_id = input_entity_id
  order by e.to_status_version desc, e.created_at desc
  limit 1;

  if latest_event_status is null or latest_event_version is null then
    raise exception 'Workflow post-sync drift: missing latest workflow event for % %',
      input_entity_type, input_entity_id;
  end if;

  if latest_event_status <> input_expected_to_status or latest_event_version <> input_expected_to_status_version then
    raise exception 'Workflow post-sync drift: latest event %/% does not match expected %/% for % %',
      latest_event_status, latest_event_version, input_expected_to_status, input_expected_to_status_version, input_entity_type, input_entity_id;
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
select 'proposal'::public.workflow_entity_type, p.id, p.status::text, p.status_version, le.to_status, le.to_status_version, le.created_at
from public.proposals p
left join latest_events le on le.entity_type = 'proposal' and le.entity_id = p.id
where p.deleted_at is null and (le.entity_id is null or p.status::text <> le.to_status or p.status_version <> le.to_status_version)
union all
select 'assignment'::public.workflow_entity_type, a.id, a.status::text, a.status_version, le.to_status, le.to_status_version, le.created_at
from public.assignments a
left join latest_events le on le.entity_type = 'assignment' and le.entity_id = a.id
where a.deleted_at is null and (le.entity_id is null or a.status::text <> le.to_status or a.status_version <> le.to_status_version)
union all
select 'shift'::public.workflow_entity_type, s.id, s.status::text, s.status_version, le.to_status, le.to_status_version, le.created_at
from public.shifts s
left join latest_events le on le.entity_type = 'shift' and le.entity_id = s.id
where s.deleted_at is null and (le.entity_id is null or s.status::text <> le.to_status or s.status_version <> le.to_status_version)
union all
select 'payment'::public.workflow_entity_type, p.id, p.status::text, p.status_version, le.to_status, le.to_status_version, le.created_at
from public.payments p
left join latest_events le on le.entity_type = 'payment' and le.entity_id = p.id
where p.deleted_at is null and (le.entity_id is null or p.status::text <> le.to_status or p.status_version <> le.to_status_version)
union all
select 'withdrawal'::public.workflow_entity_type, wr.id, wr.status::text, wr.status_version, le.to_status, le.to_status_version, le.created_at
from public.withdrawal_requests wr
left join latest_events le on le.entity_type = 'withdrawal' and le.entity_id = wr.id
where wr.deleted_at is null and (le.entity_id is null or wr.status::text <> le.to_status or wr.status_version <> le.to_status_version)
union all
select 'kyb'::public.workflow_entity_type, kyb.id, kyb.status::text, kyb.status_version, le.to_status, le.to_status_version, le.created_at
from public.kyb_records kyb
left join latest_events le on le.entity_type = 'kyb' and le.entity_id = kyb.id
where kyb.deleted_at is null and (le.entity_id is null or kyb.status::text <> le.to_status or kyb.status_version <> le.to_status_version)
union all
select 'kyc'::public.workflow_entity_type, kyc.id, kyc.status::text, kyc.status_version, le.to_status, le.to_status_version, le.created_at
from public.kyc_records kyc
left join latest_events le on le.entity_type = 'kyc' and le.entity_id = kyc.id
where kyc.deleted_at is null and (le.entity_id is null or kyc.status::text <> le.to_status or kyc.status_version <> le.to_status_version);

create or replace view public.workflow_transition_invariant_violations
with (security_invoker = true) as
with event_chain as (
  select
    e.entity_type,
    e.entity_id,
    e.from_status,
    e.from_status_version,
    e.to_status,
    e.to_status_version,
    lag(e.to_status_version) over (
      partition by e.entity_type, e.entity_id
      order by e.to_status_version, e.created_at, e.workflow_event_id
    ) as prev_to_status_version
  from public.workflow_transition_events e
),
entity_state as (
  select 'proposal'::public.workflow_entity_type as entity_type, p.id as entity_id, p.status::text as status, p.status_version
  from public.proposals p where p.deleted_at is null
  union all
  select 'assignment'::public.workflow_entity_type, a.id, a.status::text, a.status_version
  from public.assignments a where a.deleted_at is null
  union all
  select 'shift'::public.workflow_entity_type, s.id, s.status::text, s.status_version
  from public.shifts s where s.deleted_at is null
  union all
  select 'payment'::public.workflow_entity_type, p.id, p.status::text, p.status_version
  from public.payments p where p.deleted_at is null
  union all
  select 'withdrawal'::public.workflow_entity_type, wr.id, wr.status::text, wr.status_version
  from public.withdrawal_requests wr where wr.deleted_at is null
  union all
  select 'kyb'::public.workflow_entity_type, kyb.id, kyb.status::text, kyb.status_version
  from public.kyb_records kyb where kyb.deleted_at is null
  union all
  select 'kyc'::public.workflow_entity_type, kyc.id, kyc.status::text, kyc.status_version
  from public.kyc_records kyc where kyc.deleted_at is null
)
select
  'missing_initial_event'::text as violation_type,
  es.entity_type,
  es.entity_id,
  es.status as persisted_status,
  es.status_version as persisted_status_version,
  null::text as event_status,
  null::integer as event_status_version
from entity_state es
left join lateral (
  select true as has_event
  from public.workflow_transition_events e
  where e.entity_type = es.entity_type
    and e.entity_id = es.entity_id
  limit 1
) existing_event on true
where es.status_version > 0
  and existing_event.has_event is null
union all
select
  'event_version_gap'::text as violation_type,
  ec.entity_type,
  ec.entity_id,
  null::text as persisted_status,
  null::integer as persisted_status_version,
  ec.to_status as event_status,
  ec.to_status_version as event_status_version
from event_chain ec
where
  (ec.prev_to_status_version is null and ec.to_status_version <> 0)
  or (ec.prev_to_status_version is not null and ec.to_status_version <> ec.prev_to_status_version + 1)
union all
select
  'orphan_event'::text as violation_type,
  ec.entity_type,
  ec.entity_id,
  null::text as persisted_status,
  null::integer as persisted_status_version,
  ec.to_status as event_status,
  ec.to_status_version as event_status_version
from event_chain ec
left join entity_state es on es.entity_type = ec.entity_type and es.entity_id = ec.entity_id
where es.entity_id is null;

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
      and ((r.from_status is null and new.from_status is null) or r.from_status = new.from_status)
      and r.active = true
  ) then
    raise exception 'Invalid workflow transition: % from % to % is not allowed', new.entity_type, new.from_status, new.to_status;
  end if;

  select entity_status, entity_status_version
  into persisted_status, persisted_status_version
  from public.read_workflow_entity_state(new.entity_type, new.entity_id);

  if persisted_status is null then
    raise exception 'Invalid workflow transition: entity % % does not exist or is deleted', new.entity_type, new.entity_id;
  end if;

  if persisted_status <> new.to_status or persisted_status_version <> new.to_status_version then
    raise exception 'Invalid workflow transition: persisted status/version %/% does not match event target %/%',
      persisted_status, persisted_status_version, new.to_status, new.to_status_version;
  end if;

  select e.to_status, e.to_status_version
  into latest_event_status, latest_event_version
  from public.workflow_transition_events e
  where e.entity_type = new.entity_type and e.entity_id = new.entity_id
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

  select * into inserted_event from public.workflow_transition_events existing_event where existing_event.idempotency_key = final_idempotency_key;

  if found then
    if inserted_event.entity_type <> input_entity_type or inserted_event.entity_id <> input_entity_id or inserted_event.to_status <> input_to_status then
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
    when 'proposal' then select status::text, status_version into locked_current_status, locked_current_version from public.proposals where id = input_entity_id and deleted_at is null for update;
    when 'assignment' then select status::text, status_version into locked_current_status, locked_current_version from public.assignments where id = input_entity_id and deleted_at is null for update;
    when 'shift' then select status::text, status_version into locked_current_status, locked_current_version from public.shifts where id = input_entity_id and deleted_at is null for update;
    when 'payment' then select status::text, status_version into locked_current_status, locked_current_version from public.payments where id = input_entity_id and deleted_at is null for update;
    when 'withdrawal' then select status::text, status_version into locked_current_status, locked_current_version from public.withdrawal_requests where id = input_entity_id and deleted_at is null for update;
    when 'kyb' then select status::text, status_version into locked_current_status, locked_current_version from public.kyb_records where id = input_entity_id and deleted_at is null for update;
    when 'kyc' then select status::text, status_version into locked_current_status, locked_current_version from public.kyc_records where id = input_entity_id and deleted_at is null for update;
  end case;

  if locked_current_status is null then
    raise exception 'Workflow entity not found: % %', input_entity_type, input_entity_id;
  end if;

  select e.to_status, e.to_status_version
  into latest_event_status, latest_event_version
  from public.workflow_transition_events e
  where e.entity_type = input_entity_type and e.entity_id = input_entity_id
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

  select * into selected_rule
  from public.workflow_transition_rules r
  where r.entity_type = input_entity_type
    and r.to_status = input_to_status
    and (
      r.from_status = locked_current_status
      or (
        r.from_status is null
        and locked_current_status = input_to_status
        and not exists (
          select 1 from public.workflow_transition_events e where e.entity_type = input_entity_type and e.entity_id = input_entity_id
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
      when 'proposal' then update public.proposals set status = input_to_status::public.proposal_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'assignment' then update public.assignments set status = input_to_status::public.assignment_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'shift' then update public.shifts set status = input_to_status::public.shift_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'payment' then update public.payments set status = input_to_status::public.payment_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'withdrawal' then update public.withdrawal_requests set status = input_to_status::public.withdrawal_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'kyb' then update public.kyb_records set status = input_to_status::public.verification_status where id = input_entity_id returning status_version into persisted_to_version;
      when 'kyc' then update public.kyc_records set status = input_to_status::public.verification_status where id = input_entity_id returning status_version into persisted_to_version;
    end case;
  else
    persisted_to_version := locked_current_version;
  end if;

  insert into public.workflow_transition_events (
    transition_rule_id, transition_rule_version, entity_type, entity_id,
    from_status, from_status_version, to_status, to_status_version,
    transition_reason, transitioned_by, transition_source, idempotency_key,
    correlation_id, realtime_topic, guard_result, metadata
  ) values (
    selected_rule.id, selected_rule.rule_version, input_entity_type, input_entity_id,
    event_from_status, event_from_version, input_to_status, persisted_to_version,
    input_transition_reason, input_transitioned_by, input_transition_source, final_idempotency_key,
    final_correlation_id, selected_rule.realtime_topic, input_guard_result, input_metadata
  )
  returning * into inserted_event;

  insert into public.audit_logs (
    auth_account_id, action, domain, entity_table, entity_id, before_state, after_state, metadata
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

  insert into public.workflow_event_outbox (workflow_event_id, topic, payload)
  values (
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
