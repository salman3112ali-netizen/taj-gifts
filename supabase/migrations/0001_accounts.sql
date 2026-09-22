-- ─────────────────────────────────────────────────────────────
-- Taj Gifts · 0001_accounts.sql
-- Adds real customer accounts on top of Supabase Auth:
--   profiles (1:1 with auth.users), addresses (saved address book),
--   orders.user_id link, RLS policies + signup trigger.
-- Idempotent: safe to run more than once in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────

-- 1 · Profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text,
  phone      text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2 · Address book ────────────────────────────────────────────
create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  label      text not null default 'Home',
  name       text not null,
  phone      text not null,
  address    text not null,
  landmark   text,
  city       text not null,
  pincode    text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_id_idx on public.addresses (user_id);

-- 3 · Link orders to accounts ─────────────────────────────────
do $$
begin
  alter table public.orders add column user_id uuid references auth.users on delete set null;
exception
  when duplicate_column then null;
end $$;
create index if not exists orders_user_id_idx on public.orders (user_id);

-- 4 · Auto-create a profile on signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'friend'), '@', 1)),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5 · Row Level Security ──────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.addresses enable row level security;
alter table public.orders    enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

drop policy if exists addresses_select_own on public.addresses;
create policy addresses_select_own on public.addresses
  for select using (auth.uid() = user_id);
drop policy if exists addresses_insert_own on public.addresses;
create policy addresses_insert_own on public.addresses
  for insert with check (auth.uid() = user_id);
drop policy if exists addresses_update_own on public.addresses;
create policy addresses_update_own on public.addresses
  for update using (auth.uid() = user_id);
drop policy if exists addresses_delete_own on public.addresses;
create policy addresses_delete_own on public.addresses
  for delete using (auth.uid() = user_id);

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select using (auth.uid() = user_id);
drop policy if exists order_items_select_own on public.order_items;
create policy order_items_select_own on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- service_role (used by our server API) bypasses RLS automatically,
-- so admin + checkout keep working exactly as before.
-- ───────────────────────── done ──────────────────────────────
