-- Steen: every account syncs its data, not just Pro.
-- The app now requires a (free) account, so data lives with the account.

drop policy if exists "records: insert own (pro)" on public.records;
drop policy if exists "records: update own (pro)" on public.records;
drop policy if exists "records: insert own" on public.records;
drop policy if exists "records: update own" on public.records;

create policy "records: insert own" on public.records
  for insert with check (auth.uid() = user_id);

create policy "records: update own" on public.records
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Backfill profiles for any users created before the trigger existed.
insert into public.profiles (id, email)
select u.id, lower(u.email) from auth.users u
on conflict (id) do nothing;
