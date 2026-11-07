-- ─────────────────────────────────────────────────────────────────────────────
-- Taj Gifts · 0002_real_fulfilment_and_delivery_otp.sql
-- Production fulfilment layer:
--   • secure, expiring, one-time delivery OTPs (hash + encrypted display copy)
--   • shipment/rider/courier and delivery-proof data
--   • immutable-style operational event history
--   • idempotent checkout requests and secret order-tracking links
--
-- Run this AFTER 0001_accounts.sql in Supabase SQL Editor.
-- Safe to run more than once. Service-role server routes bypass RLS; no customer
-- can query another customer's fulfilment or OTP records directly.
-- ─────────────────────────────────────────────────────────────────────────────

-- Secure tracking and checkout idempotency on the existing orders table.
do $$
begin
  alter table public.orders add column tracking_token_hash text;
exception when duplicate_column then null;
end $$;

do $$
begin
  alter table public.orders add column tracking_token_ciphertext text;
exception when duplicate_column then null;
end $$;

do $$
begin
  alter table public.orders add column client_request_id text;
exception when duplicate_column then null;
end $$;

create unique index if not exists orders_client_request_id_unique
  on public.orders (client_request_id)
  where client_request_id is not null;

-- One active delivery OTP per order. `orders.id` in the existing Taj Gifts
-- database is a text order code (not a UUID), so every operational foreign-key
-- column intentionally uses text as well. The raw OTP is never stored in a
-- timeline or exposed to admin APIs. Its encrypted copy can only be decrypted
-- server-side for a holder of that order's private tracking link / signed-in account.
create table if not exists public.delivery_otps (
  order_id       text primary key references public.orders(id) on delete cascade,
  code_hash      text not null,
  code_ciphertext text not null,
  expires_at     timestamptz not null,
  sent_at        timestamptz not null default now(),
  last_sent_at   timestamptz not null default now(),
  resend_count   integer not null default 0 check (resend_count >= 0 and resend_count <= 5),
  attempts       integer not null default 0 check (attempts >= 0),
  max_attempts   integer not null default 5 check (max_attempts between 1 and 10),
  verified_at    timestamptz,
  verified_by    text,
  sent_channels  jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists delivery_otps_active_idx
  on public.delivery_otps (expires_at)
  where verified_at is null;

-- Delivery metadata. This supports a self-delivery rider today and a courier with
-- tracking link tomorrow without a change to the checkout data model.
create table if not exists public.order_fulfilments (
  order_id          text primary key references public.orders(id) on delete cascade,
  delivery_mode     text not null default 'local' check (delivery_mode in ('local', 'courier', 'pickup')),
  rider_name        text,
  rider_phone       text,
  courier_name      text,
  tracking_number   text,
  tracking_url      text,
  dispatch_note     text,
  latest_attempt_note text,
  delivery_note     text,
  out_for_delivery_at timestamptz,
  delivered_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Every sensitive fulfilment action is written as an operational event. It is
-- intentionally separate from the customer-safe order timeline.
create table if not exists public.order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    text not null references public.orders(id) on delete cascade,
  actor       text not null default 'owner',
  event_type  text not null,
  title       text not null,
  note        text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists order_events_order_created_idx
  on public.order_events (order_id, created_at desc);

-- Correct only the old starter placeholders, never a value the owner has already changed.
update public.settings
set data = jsonb_set(
  jsonb_set(
    jsonb_set(data, '{phone}', to_jsonb('+91 76688 19833'::text), true),
    '{whatsapp}', to_jsonb('917668819833'::text), true
  ),
  '{address}', to_jsonb('Pakiza Colony, Kashipur, Uttarakhand 244713, India'::text), true
), updated_at = now()
where id = 'shop'
  and coalesce(data ->> 'phone', '') in ('', '+91 98765 43210', '9876543210');

-- Tables are server-only operational data. The website's normal order-history RLS
-- remains on public.orders/order_items; all admin/OTP routes use the server-only
-- Supabase service role.
alter table public.delivery_otps enable row level security;
alter table public.order_fulfilments enable row level security;
alter table public.order_events enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- done
-- ─────────────────────────────────────────────────────────────────────────────
