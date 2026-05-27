-- Workflow outbox worker: batch claim, publish completion, and retry-aware failure handling.
-- Uses FOR UPDATE SKIP LOCKED for worker-safe concurrent claiming.

create or replace function public.recover_stale_workflow_outbox_processing(
  p_processing_lease interval default interval '5 minutes'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  recovered_count integer;
begin
  update public.workflow_event_outbox
  set
    status = 'failed',
    last_error = coalesce(last_error, '') || case
      when coalesce(last_error, '') = '' then 'stale processing lease recovered'
      else ' | stale processing lease recovered'
    end,
    next_attempt_at = now(),
    updated_at = now()
  where status = 'processing'
    and deleted_at is null
    and updated_at < now() - p_processing_lease;

  get diagnostics recovered_count = row_count;
  return recovered_count;
end;
$$;

create or replace function public.claim_workflow_outbox_batch(
  p_batch_size integer default 50,
  p_processing_lease interval default interval '5 minutes'
)
returns setof public.workflow_event_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_batch_size is null or p_batch_size < 1 then
    raise exception 'p_batch_size must be >= 1';
  end if;

  perform public.recover_stale_workflow_outbox_processing(p_processing_lease);

  return query
  with picked as (
    select o.id
    from public.workflow_event_outbox o
    where o.deleted_at is null
      and o.status in ('pending', 'failed')
      and o.next_attempt_at <= now()
    order by o.next_attempt_at asc, o.created_at asc
    limit p_batch_size
    for update skip locked
  )
  update public.workflow_event_outbox o
  set
    status = 'processing',
    updated_at = now()
  from picked p
  where o.id = p.id
  returning o.*;
end;
$$;

create or replace function public.complete_workflow_outbox_publish(
  p_outbox_id uuid
)
returns public.workflow_event_outbox
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.workflow_event_outbox;
begin
  update public.workflow_event_outbox
  set
    status = 'published',
    published_at = coalesce(published_at, now()),
    last_error = null,
    updated_at = now()
  where id = p_outbox_id
    and deleted_at is null
    and status in ('processing', 'published')
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'workflow_event_outbox row % is not publishable (missing or invalid status)', p_outbox_id;
  end if;

  return updated_row;
end;
$$;

create or replace function public.fail_workflow_outbox_publish(
  p_outbox_id uuid,
  p_error text,
  p_max_attempts integer default 10,
  p_base_backoff_seconds integer default 5,
  p_max_backoff_seconds integer default 3600
)
returns public.workflow_event_outbox
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.workflow_event_outbox;
  next_attempts integer;
  backoff_seconds integer;
  trimmed_error text;
begin
  if p_max_attempts is null or p_max_attempts < 1 then
    raise exception 'p_max_attempts must be >= 1';
  end if;

  select *
  into current_row
  from public.workflow_event_outbox
  where id = p_outbox_id
    and deleted_at is null
  for update;

  if current_row.id is null then
    raise exception 'workflow_event_outbox row % not found', p_outbox_id;
  end if;

  if current_row.status not in ('processing', 'failed', 'pending') then
    raise exception 'workflow_event_outbox row % cannot fail from status %', p_outbox_id, current_row.status;
  end if;

  trimmed_error := left(coalesce(p_error, 'unknown publish error'), 2000);
  next_attempts := current_row.attempts + 1;

  if next_attempts >= p_max_attempts then
    update public.workflow_event_outbox
    set
      status = 'dead_lettered',
      attempts = next_attempts,
      last_error = trimmed_error,
      next_attempt_at = now(),
      updated_at = now()
    where id = p_outbox_id
    returning * into current_row;

    return current_row;
  end if;

  backoff_seconds := least(
    p_max_backoff_seconds,
    p_base_backoff_seconds * power(2, greatest(next_attempts - 1, 0))::integer
  );

  update public.workflow_event_outbox
  set
    status = 'failed',
    attempts = next_attempts,
    last_error = trimmed_error,
    next_attempt_at = now() + make_interval(secs => backoff_seconds),
    updated_at = now()
  where id = p_outbox_id
  returning * into current_row;

  return current_row;
end;
$$;

grant execute on function public.recover_stale_workflow_outbox_processing(interval) to service_role;
grant execute on function public.claim_workflow_outbox_batch(integer, interval) to service_role;
grant execute on function public.complete_workflow_outbox_publish(uuid) to service_role;
grant execute on function public.fail_workflow_outbox_publish(uuid, text, integer, integer, integer) to service_role;
