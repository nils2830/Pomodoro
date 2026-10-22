-- Steen: admin overview numbers, per-member summaries and a site-wide announcement.
-- The functions are security definer and only callable with the service role,
-- which the /api/admin routes use after checking ADMIN_EMAILS.

create or replace function public.admin_stats()
returns jsonb
language sql
stable
security definer set search_path = ''
as $$
  with focus as (
    select user_id,
           (data->>'startedAt')::numeric  as started,
           (data->>'durationMs')::numeric as ms
    from public.records
    where collection = 'entries' and not deleted and data->>'mode' = 'focus'
  ),
  clock as (select extract(epoch from now()) * 1000 as t)
  select jsonb_build_object(
    'signups7',    (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'signups30',   (select count(*) from public.profiles where created_at > now() - interval '30 days'),
    'active1',     (select count(distinct user_id) from focus, clock where started > t - 86400000),
    'active7',     (select count(distinct user_id) from focus, clock where started > t - 7 * 86400000),
    'active30',    (select count(distinct user_id) from focus, clock where started > t - 30 * 86400000),
    'sessions7',   (select count(*) from focus, clock where started > t - 7 * 86400000),
    'focusHours7', (select round(coalesce(sum(ms), 0) / 3600000.0, 1) from focus, clock where started > t - 7 * 86400000),
    'monthly',     (select count(*) from public.profiles where plan = 'pro' and plan_interval = 'month'),
    'yearly',      (select count(*) from public.profiles where plan = 'pro' and plan_interval = 'year'),
    'signupsByDay', (
      select coalesce(jsonb_agg(jsonb_build_object('day', day, 'n', n) order by day), '[]'::jsonb)
      from (
        select created_at::date as day, count(*) as n
        from public.profiles
        where created_at > now() - interval '30 days'
        group by 1
      ) d
    )
  );
$$;

create or replace function public.admin_user_summary(uid uuid)
returns jsonb
language sql
stable
security definer set search_path = ''
as $$
  select jsonb_build_object(
    'sessions',    count(*),
    'focusHours',  round(coalesce(sum((data->>'durationMs')::numeric), 0) / 3600000.0, 1),
    'lastSession', max((data->>'startedAt')::numeric)
  )
  from public.records
  where user_id = uid and collection = 'entries' and not deleted and data->>'mode' = 'focus';
$$;

revoke all on function public.admin_stats() from public, anon, authenticated;
revoke all on function public.admin_user_summary(uuid) from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;
grant execute on function public.admin_user_summary(uuid) to service_role;

-- One row. Everyone may read it while it's switched on; only the service role writes.
create table if not exists public.announcements (
  id         smallint primary key default 1 check (id = 1),
  message    text not null default '' check (char_length(message) <= 280),
  active     boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "announcements: read active" on public.announcements;
create policy "announcements: read active" on public.announcements
  for select to anon, authenticated using (active);
insert into public.announcements (id) values (1) on conflict (id) do nothing;
