-- Cadence: gifted Pro ("grants") managed by the site admin.
-- Run after 0001_init.sql.

-- Emails are compared case-insensitively everywhere.
update public.profiles set email = lower(email) where email <> lower(email);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Keep profiles.email current if someone changes their address.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email), updated_at = now() where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute procedure public.handle_user_email_change();

-- ─── Grants ──────────────────────────────────────────────────
-- Keyed by email, so you can gift Pro before a friend has signed up.
-- Supabase verifies email ownership at sign-in, so only the owner of
-- the address can claim it.
create table if not exists public.pro_grants (
  email      text primary key check (email = lower(email)),
  expires_at timestamptz,          -- null = forever
  note       text,
  granted_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pro_grants enable row level security;

-- People can see their own grant. Only the server (service role) writes.
drop policy if exists "pro_grants: read own" on public.pro_grants;
create policy "pro_grants: read own" on public.pro_grants
  for select using (email = lower(auth.jwt() ->> 'email'));

-- Pro = an active Stripe subscription OR an active grant.
create or replace function public.is_pro(uid uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and (
        p.plan = 'pro'
        or exists (
          select 1 from public.pro_grants g
          where g.email = lower(p.email)
            and (g.expires_at is null or g.expires_at > now())
        )
      )
  );
$$;
