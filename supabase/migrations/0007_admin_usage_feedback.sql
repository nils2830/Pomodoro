-- Steen: what members use (for /admin), week-one retention, and a feedback inbox.

create or replace function public.admin_usage()
returns jsonb
language sql
stable
security definer set search_path = ''
as $$
  with s as (select data->'data' as d from public.records where collection = 'focus.settings' and not deleted),
       p as (select data->'data' as d from public.records where collection = 'prefs' and not deleted),
       f as (
         select data from public.records
         where collection = 'entries' and not deleted and data->>'mode' = 'focus'
           and (data->>'startedAt')::numeric > extract(epoch from now()) * 1000 - 30 * 86400000::bigint
       )
  select jsonb_build_object(
    'face', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (select coalesce(d->>'face', 'default') k, count(*) n from s group by 1) x),
    'theme', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (select coalesce(d->>'theme', 'default') k, count(*) n from s group by 1) x),
    'background', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (select coalesce(d->>'background', 'default') k, count(*) n from s group by 1) x),
    'warmup', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (select coalesce(d->>'warmupWhen', 'default') k, count(*) n from s group by 1) x),
    'language', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (select coalesce(d->>'language', 'default') k, count(*) n from p group by 1) x),
    'font', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (select coalesce(d->>'font', 'default') k, count(*) n from p group by 1) x),
    'members', (select count(*) from s),
    'askDistractions', (select count(*) filter (where coalesce((d->>'askDistractions')::boolean, true)) from s),
    'sessions30', (select count(*) from f),
    'avgMinutes30', (select round(coalesce(avg((data->>'durationMs')::numeric), 0) / 60000, 1) from f),
    'completed30', (select count(*) filter (where (data->>'completed')::boolean) from f),
    'distractionsLogged30', (select count(*) from f where jsonb_typeof(data->'distractions') = 'number'),
    'retentionCohort', (select count(*) from public.profiles where created_at < now() - interval '7 days'),
    'retentionReturned', (
      select count(*) from public.profiles pr
      where pr.created_at < now() - interval '7 days'
        and exists (
          select 1 from public.records r
          where r.user_id = pr.id and r.collection = 'entries' and not r.deleted
            and (r.data->>'startedAt')::numeric >= extract(epoch from pr.created_at + interval '7 days') * 1000
        )
    )
  );
$$;

revoke all on function public.admin_usage() from public, anon, authenticated;
grant execute on function public.admin_usage() to service_role;

-- Members write here from settings; only the service role (/admin) reads.
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  email      text,
  kind       text not null default 'idea' check (kind in ('idea', 'problem', 'other')),
  message    text not null check (char_length(message) between 1 and 2000),
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);
alter table public.feedback enable row level security;
drop policy if exists "feedback: send own" on public.feedback;
create policy "feedback: send own" on public.feedback
  for insert to authenticated with check (user_id = auth.uid() and resolved = false);
