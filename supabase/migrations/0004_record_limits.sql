-- Steen: cap the size of one synced record.
-- Every account can write records since 0003, so a single row must not grow
-- without bound. Real records (entries, tasks, settings) are a few KB at most.
-- NOT VALID leaves existing rows alone; every insert and update is checked.

alter table public.records drop constraint if exists records_data_size;
alter table public.records add constraint records_data_size
  check (pg_column_size(data) <= 262144) not valid;
