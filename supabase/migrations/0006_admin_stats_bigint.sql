-- Steen: 30 days in ms overflows int4 in admin_stats; compute the windows in bigint.

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
    'active1',     (select count(distinct user_id) from focus, clock where started > t - 86400000::bigint),
    'active7',     (select count(distinct user_id) from focus, clock where started > t - 7 * 86400000::bigint),
    'active30',    (select count(distinct user_id) from focus, clock where started > t - 30 * 86400000::bigint),
    'sessions7',   (select count(*) from focus, clock where started > t - 7 * 86400000::bigint),
    'focusHours7', (select round(coalesce(sum(ms), 0) / 3600000.0, 1) from focus, clock where started > t - 7 * 86400000::bigint),
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
