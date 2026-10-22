-- Adds seller-managed colours. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- (Safe to run more than once. Only needed if you already ran schema.sql before this was added.)

create table if not exists colors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

alter table products add column if not exists color_ids uuid[] not null default '{}';

alter table colors enable row level security;

drop policy if exists "public read colors" on colors;
create policy "public read colors" on colors for select using (true);

drop policy if exists "seller write colors" on colors;
create policy "seller write colors" on colors for all to authenticated using (true) with check (true);
