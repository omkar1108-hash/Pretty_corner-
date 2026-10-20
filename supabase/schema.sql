-- Pretty Corner database schema.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- categories
create table if not exists materials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists product_types (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ products
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  price       numeric(10, 2) not null check (price >= 0),
  -- 'product' = finished item, 'supply' = crafting material for sale
  kind        text not null default 'product' check (kind in ('product', 'supply')),
  material_id uuid references materials (id) on delete set null,
  type_id     uuid references product_types (id) on delete set null,
  size        text not null default '',
  color       text not null default '',
  images      text[] not null default '{}',
  available   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists products_created_idx on products (created_at desc);

-- ---------------------------------------------------------------- enquiries
-- Every "Buy" click and every custom request is logged here, so nothing is lost
-- even if an email or WhatsApp message is missed.
create table if not exists enquiries (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('order', 'custom')),
  name       text not null,
  station    text not null,
  product_id uuid references products (id) on delete set null,
  details    jsonb not null default '{}'::jsonb,
  images     text[] not null default '{}',
  status     text not null default 'new' check (status in ('new', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists enquiries_created_idx on enquiries (created_at desc);

-- ----------------------------------------------------- row level security
alter table materials     enable row level security;
alter table product_types enable row level security;
alter table products      enable row level security;
alter table enquiries     enable row level security;

-- Anyone (buyers, no login) can read the catalogue.
create policy "public read materials"     on materials     for select using (true);
create policy "public read product_types" on product_types for select using (true);
create policy "public read products"      on products      for select using (true);

-- Only the logged-in seller can change the catalogue.
create policy "seller write materials"     on materials     for all to authenticated using (true) with check (true);
create policy "seller write product_types" on product_types for all to authenticated using (true) with check (true);
create policy "seller write products"      on products      for all to authenticated using (true) with check (true);

-- Buyers can only *create* enquiries; only the seller can read / update / delete them.
create policy "anyone can create enquiry" on enquiries for insert to anon, authenticated
  with check (true);
create policy "seller manages enquiries" on enquiries for select to authenticated using (true);
create policy "seller updates enquiries" on enquiries for update to authenticated using (true) with check (true);
create policy "seller deletes enquiries" on enquiries for delete to authenticated using (true);

-- ------------------------------------------------------------------ storage
-- product-images: public read, seller upload.
-- custom-requests: public read (so the seller can open links), buyers can upload.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('custom-requests', 'custom-requests', true)
on conflict (id) do nothing;

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "seller upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "seller update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
create policy "seller delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

create policy "public read custom request images" on storage.objects
  for select using (bucket_id = 'custom-requests');
create policy "anyone upload custom request images" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'custom-requests');

-- ---------------------------------------------------------- starter categories
insert into materials (name) values
  ('Chenille (Pipe Cleaner)'), ('Crochet (Wool)'), ('Beads, Pearl & Kundan')
on conflict do nothing;

insert into product_types (name) values
  ('Hair Clip'), ('Keychain'), ('Scrunchie'), ('Bag Charm'),
  ('Phone Cover'), ('Necklace'), ('Earrings'), ('Flower')
on conflict do nothing;
