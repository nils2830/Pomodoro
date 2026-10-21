-- Cadence: accounts, plans and generic synced records.
-- Run in the Supabase SQL editor or with `supabase db push`.

-- ─── Profiles ────────────────────────────────────────────────
-- One row per user. Billing columns are written only by the server
-- (Stripe webhook with the service role), never by the client.
create table if not exists public.profiles (
  id                     uuid primary key references auth.users on delete cascade,
  email                  text,
  plan                   text not null default 'free' check (plan in ('free', 'pro')),
  plan_interval          text check (plan_interval in ('month', 'year')),
  plan_status            text,
  current_period_end     timestamptz,
  stripe_customer_id     text unique,
  stripe_subscription_id text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
-- Deliberately no insert/update/delete policies for end users.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Records ─────────────────────────────────────────────────
-- Generic store for every synced collection (entries, tasks, settings…).
-- New modules add collections without new tables.
create sequence if not exists public.records_seq;

create table if not exists public.records (
  user_id    uuid   not null default auth.uid() references auth.users on delete cascade,
  collection text   not null,
  id         text   not null,
  data       jsonb  not null,
  updated_at bigint not null,          -- client timestamp (ms), used for last-write-wins
  deleted    boolean not null default false,
  seq        bigint not null default nextval('public.records_seq'), -- server change number, used for pulls
  primary key (user_id, collection, id)
);

create index if not exists records_pull_idx on public.records (user_id, collection, seq);

-- Last write wins: ignore updates that are older than what is stored,
-- and stamp every accepted change with a fresh sequence number.
create or replace function public.records_lww()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.updated_at <= old.updated_at then
      return null; -- skip stale write
    end if;
  end if;
  new.seq := nextval('public.records_seq');
  return new;
end;
$$;

drop trigger if exists records_lww on public.records;
create trigger records_lww
  before insert or update on public.records
  for each row execute procedure public.records_lww();

alter table public.records enable row level security;

-- Reading your own data is always allowed (so a lapsed subscriber can
-- still download everything). Writing requires an active Pro plan.
create or replace function public.is_pro(uid uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.plan = 'pro');
$$;

drop policy if exists "records: read own" on public.records;
create policy "records: read own" on public.records
  for select using (auth.uid() = user_id);

drop policy if exists "records: insert own (pro)" on public.records;
create policy "records: insert own (pro)" on public.records
  for insert with check (auth.uid() = user_id and public.is_pro(auth.uid()));

drop policy if exists "records: update own (pro)" on public.records;
create policy "records: update own (pro)" on public.records
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and public.is_pro(auth.uid()));

drop policy if exists "records: delete own" on public.records;
create policy "records: delete own" on public.records
  for delete using (auth.uid() = user_id);
