-- ─────────────────────────────────────────────────────────────────────────────
-- Taj Gifts · 0003_account_only_atomic_checkout.sql
-- Production commerce hardening:
--   • Every NEW order belongs to a real authenticated customer account.
--   • Browser clients cannot write orders or line items directly.
--   • Checkout inventory, coupon accounting, customer ledger and order/item writes
--     happen in one PostgreSQL transaction, preventing oversells and half-orders.
--   • Historic guest orders remain readable/operable by the studio; only INSERTS
--     are account-gated, so legacy status updates are not broken.
--   • Cancelling an order restocks inventory atomically and exactly once.
--
-- Safe to run once through Supabase migration tooling. Do not run it before the
-- matching application source is deployed unless temporarily blocking guest
-- checkout is intentional.
-- ─────────────────────────────────────────────────────────────────────────────

-- The current server code already attempts to set this on payment events. Make
-- it a real column and keep it current on every update.
alter table public.orders add column if not exists updated_at timestamptz;
update public.orders
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;
alter table public.orders alter column updated_at set default now();
alter table public.orders alter column updated_at set not null;

create or replace function public.taj_touch_order_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists taj_orders_touch_updated_at on public.orders;
create trigger taj_orders_touch_updated_at
before update on public.orders
for each row execute function public.taj_touch_order_updated_at();

-- Data was audited before this migration: existing orders and items satisfy these
-- invariants. They prevent future negative/malformed commercial records.
do $$
begin
  alter table public.orders add constraint orders_nonnegative_totals_check
    check (
      coalesce(subtotal, 0) >= 0
      and coalesce(discount, 0) >= 0
      and coalesce(delivery_charge, 0) >= 0
      and coalesce(total, 0) = coalesce(subtotal, 0) - coalesce(discount, 0) + coalesce(delivery_charge, 0)
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_status_check
    check (status is null or status in ('placed', 'pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_payment_method_check
    check (payment_method is null or payment_method in ('COD', 'UPI', 'Razorpay'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_payment_status_check
    check (payment_status is null or payment_status in ('pending', 'paid', 'failed', 'refunded', 'not_required'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.order_items add constraint order_items_commercial_values_check
    check (
      coalesce(qty, 0) > 0
      and coalesce(unit_price, 0) >= 0
      and coalesce(base_price, 0) >= 0
      and coalesce(line_total, 0) = coalesce(unit_price, 0) * coalesce(qty, 0)
    );
exception when duplicate_object then null;
end $$;

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create unique index if not exists orders_razorpay_order_id_unique
  on public.orders (razorpay_order_id)
  where razorpay_order_id is not null;
create unique index if not exists orders_razorpay_payment_id_unique
  on public.orders (razorpay_payment_id)
  where razorpay_payment_id is not null;
create unique index if not exists addresses_one_default_per_user
  on public.addresses (user_id)
  where is_default;

-- Customer profile writes are intentionally limited to customer-safe columns.
-- RLS controls which row a customer can touch; this trigger prevents a crafted
-- REST request from self-assigning the reserved is_admin flag.
create or replace function public.taj_protect_profile_privileges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.is_admin = false;
    elsif new.is_admin is distinct from old.is_admin then
      new.is_admin = old.is_admin;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists taj_profiles_protect_privileges on public.profiles;
create trigger taj_profiles_protect_privileges
before insert or update on public.profiles
for each row execute function public.taj_protect_profile_privileges();

-- Explicitly remove the two permissive public write paths and the old
-- authenticated direct-order path. The server-only function below is now the
-- sole legitimate checkout writer. Existing owner-only SELECT policies remain.
drop policy if exists orders_anon_insert on public.orders;
drop policy if exists orders_insert_own on public.orders;
drop policy if exists order_items_anon_insert on public.order_items;

-- This INSERT-only guard is deliberately a trigger instead of a NOT NULL/CHECK
-- on orders.user_id. Five historic guest orders retain NULL owners and can still
-- receive studio updates, cancellations and fulfilment records.
create or replace function public.taj_require_order_account()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is null then
    raise exception using
      errcode = '23514',
      message = 'A signed-in customer account is required to create an order.';
  end if;
  return new;
end;
$$;

drop trigger if exists taj_orders_require_account_insert on public.orders;
create trigger taj_orders_require_account_insert
before insert on public.orders
for each row execute function public.taj_require_order_account();

-- Prevent a service-role coding mistake from creating line items for a legacy
-- ownerless order. The checkout function inserts the account-owned parent first.
create or replace function public.taj_require_account_owned_order_item()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from public.orders where id = new.order_id;
  if v_user_id is null then
    raise exception using
      errcode = '23514',
      message = 'Order items may only be added to an account-owned order.';
  end if;
  return new;
end;
$$;

drop trigger if exists taj_order_items_require_account_order_insert on public.order_items;
create trigger taj_order_items_require_account_order_insert
before insert on public.order_items
for each row execute function public.taj_require_account_owned_order_item();

-- A single transaction for a real checkout. It receives an already-authenticated
-- customer ID from the server, re-validates catalog/variant/add-on prices from
-- the live database under row locks, reserves stock, inserts order + line items,
-- increments a valid coupon, and updates the customer ledger atomically.
create or replace function public.taj_create_account_order(
  p_user_id uuid,
  p_order jsonb,
  p_items jsonb
)
returns table(order_id text, order_total integer, is_duplicate boolean)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_existing_id text;
  v_existing_total integer;
  v_order_id text;
  v_request_id text;
  v_coupon_code text;
  v_coupon public.coupons%rowtype;
  v_product public.products%rowtype;
  v_line jsonb;
  v_variant jsonb;
  v_addon jsonb;
  v_product_id uuid;
  v_qty integer;
  v_base_price integer;
  v_unit_price integer;
  v_line_total integer;
  v_variant_label text;
  v_variant_price integer;
  v_addons jsonb;
  v_addon_label text;
  v_addon_price integer;
  v_addons_price integer;
  v_seen_addons text[];
  v_subtotal integer;
  v_discount integer;
  v_delivery integer;
  v_total integer;
  v_payment_method text;
  v_source text;
  v_phone text;
  v_name text;
  v_email text;
  v_address text;
  v_city text;
  v_pincode text;
  v_landmark text;
  v_gift_note text;
  v_gift_occasion text;
  v_gift_date text;
  v_sender_name text;
  v_tracking_hash text;
  v_tracking_ciphertext text;
  v_created_at timestamptz := now();
  v_expected_discount integer;
begin
  if p_user_id is null then
    raise exception using errcode = '23514', message = 'A signed-in customer account is required to create an order.';
  end if;
  if jsonb_typeof(p_order) <> 'object' or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Checkout data is incomplete.';
  end if;
  if jsonb_array_length(p_items) > 25 then
    raise exception using errcode = '22023', message = 'A checkout can contain at most 25 different line items.';
  end if;

  -- Serialise concurrent checkout attempts from the same account. This makes the
  -- request idempotency check and per-account anti-spam limit race-safe.
  perform pg_advisory_xact_lock(hashtextextended('taj-order:' || p_user_id::text, 0));

  v_request_id := nullif(btrim(coalesce(p_order ->> 'client_request_id', '')), '');
  if v_request_id is not null and v_request_id !~ '^[A-Za-z0-9_-]{8,160}$' then
    raise exception using errcode = '22023', message = 'Invalid checkout request identifier.';
  end if;
  if v_request_id is not null then
    select id, total into v_existing_id, v_existing_total
    from public.orders
    where user_id = p_user_id and client_request_id = v_request_id
    limit 1;
    if found then
      return query select v_existing_id, v_existing_total, true;
      return;
    end if;
  end if;

  -- A real account is not an unlimited stock-reservation bot. Bulk customers can
  -- still place a larger cart or contact the studio for a quote.
  if (select count(*) from public.orders where user_id = p_user_id and created_at >= now() - interval '1 hour') >= 6 then
    raise exception using errcode = 'P0001', message = 'For security, this account has reached the order limit for this hour. Please contact the studio for help.';
  end if;

  v_name := btrim(coalesce(p_order ->> 'customer_name', ''));
  v_phone := regexp_replace(coalesce(p_order ->> 'customer_phone', ''), '[^0-9]', '', 'g');
  if length(v_phone) = 11 and left(v_phone, 1) = '0' then v_phone := right(v_phone, 10); end if;
  if length(v_phone) = 12 and left(v_phone, 2) = '91' then v_phone := right(v_phone, 10); end if;
  v_email := lower(btrim(coalesce(p_order ->> 'customer_email', '')));
  v_address := btrim(coalesce(p_order ->> 'customer_address', ''));
  v_city := btrim(coalesce(p_order ->> 'customer_city', ''));
  v_pincode := btrim(coalesce(p_order ->> 'customer_pincode', ''));
  v_landmark := nullif(btrim(coalesce(p_order ->> 'customer_landmark', '')), '');
  v_gift_note := nullif(btrim(coalesce(p_order ->> 'gift_note', '')), '');
  v_gift_occasion := nullif(btrim(coalesce(p_order ->> 'gift_occasion', '')), '');
  v_gift_date := nullif(btrim(coalesce(p_order ->> 'gift_delivery_date', '')), '');
  v_sender_name := nullif(btrim(coalesce(p_order ->> 'gift_sender_name', '')), '');
  v_tracking_hash := nullif(btrim(coalesce(p_order ->> 'tracking_token_hash', '')), '');
  v_tracking_ciphertext := nullif(btrim(coalesce(p_order ->> 'tracking_token_ciphertext', '')), '');

  if length(v_name) not between 2 and 120
     or v_phone !~ '^[6-9][0-9]{9}$'
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or length(v_address) not between 8 and 350
     or length(v_city) not between 2 and 100
     or v_pincode !~ '^[0-9]{6}$'
     or (v_landmark is not null and length(v_landmark) > 160)
     or (v_gift_note is not null and length(v_gift_note) > 220)
     or (v_gift_occasion is not null and length(v_gift_occasion) > 100)
     or (v_gift_date is not null and (v_gift_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or v_gift_date::date < current_date))
     or (v_sender_name is not null and length(v_sender_name) > 120)
     or v_tracking_hash is null
     or v_tracking_ciphertext is null then
    raise exception using errcode = '22023', message = 'Please check the customer and delivery details.';
  end if;

  v_subtotal := coalesce((p_order ->> 'subtotal')::integer, -1);
  v_discount := coalesce((p_order ->> 'discount')::integer, -1);
  v_delivery := coalesce((p_order ->> 'delivery_charge')::integer, -1);
  v_total := coalesce((p_order ->> 'total')::integer, -1);
  if v_subtotal < 0 or v_discount < 0 or v_delivery < 0 or v_total <> v_subtotal - v_discount + v_delivery then
    raise exception using errcode = '22023', message = 'Checkout totals could not be verified.';
  end if;

  v_payment_method := upper(btrim(coalesce(p_order ->> 'payment_method', '')));
  if v_payment_method not in ('COD', 'UPI') then
    raise exception using errcode = '22023', message = 'Please choose a supported payment method.';
  end if;
  v_source := lower(btrim(coalesce(p_order ->> 'source', 'web')));
  if v_source not in ('web', 'android') then v_source := 'web'; end if;

  v_coupon_code := nullif(upper(btrim(coalesce(p_order ->> 'coupon', ''))), '');
  if v_coupon_code is not null then
    select * into v_coupon from public.coupons where code = v_coupon_code for update;
    if not found or coalesce(v_coupon.active, false) is not true then
      raise exception using errcode = 'P0001', message = 'That gift code is no longer active.';
    end if;
    if v_subtotal < coalesce(v_coupon.min_order, 0) then
      raise exception using errcode = 'P0001', message = 'That gift code no longer applies to this basket.';
    end if;
    v_expected_discount := case
      when v_coupon.type = 'percent' then least(v_subtotal, round(v_subtotal * coalesce(v_coupon.value, 0) / 100.0)::integer)
      else least(v_subtotal, coalesce(v_coupon.value, 0))
    end;
    if v_discount <> v_expected_discount then
      raise exception using errcode = '22023', message = 'The gift code total changed. Please review checkout and try again.';
    end if;
  elsif v_discount <> 0 then
    raise exception using errcode = '22023', message = 'Checkout discount could not be verified.';
  end if;

  -- Lock every inventory row, prove its live catalog prices, and decrement it
  -- before the transaction is allowed to commit. Any failure rolls all changes
  -- back together.
  v_expected_discount := 0;
  for v_line in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := (v_line ->> 'product_id')::uuid;
      v_qty := (v_line ->> 'qty')::integer;
      v_base_price := (v_line ->> 'base_price')::integer;
      v_unit_price := (v_line ->> 'unit_price')::integer;
      v_line_total := (v_line ->> 'line_total')::integer;
    exception when others then
      raise exception using errcode = '22023', message = 'One item in the basket is invalid.';
    end;
    if v_qty not between 1 and 99 or v_base_price < 0 or v_unit_price < 0 or v_line_total <> v_unit_price * v_qty then
      raise exception using errcode = '22023', message = 'One item quantity or price is invalid.';
    end if;

    select * into v_product from public.products where id = v_product_id for update;
    if not found then
      raise exception using errcode = 'P0001', message = 'A hamper in your basket is no longer available.';
    end if;
    if coalesce(v_product.published, false) is not true then
      raise exception using errcode = 'P0001', message = format('“%s” is not currently available.', v_product.name);
    end if;
    if coalesce(v_product.stock, 0) < v_qty then
      raise exception using errcode = 'P0001', message = format('“%s” has only %s piece(s) left. Please reduce the quantity.', v_product.name, greatest(coalesce(v_product.stock, 0), 0));
    end if;
    if v_base_price <> v_product.price then
      raise exception using errcode = 'P0001', message = format('The price of “%s” changed. Please review your basket.', v_product.name);
    end if;

    v_variant_label := nullif(btrim(coalesce(v_line ->> 'variant', '')), '');
    v_variant_price := 0;
    if v_variant_label is not null then
      select value into v_variant
      from jsonb_array_elements(coalesce(v_product.variants, '[]'::jsonb))
      where value ->> 'label' = v_variant_label
      limit 1;
      if not found then
        raise exception using errcode = 'P0001', message = format('The selected style for “%s” is no longer available.', v_product.name);
      end if;
      begin v_variant_price := coalesce((v_variant ->> 'price')::integer, 0); exception when others then
        raise exception using errcode = '22023', message = 'A product style has an invalid price.';
      end;
    end if;

    v_addons := coalesce(v_line -> 'addons', '[]'::jsonb);
    if jsonb_typeof(v_addons) <> 'array' then
      raise exception using errcode = '22023', message = 'Product add-ons are invalid.';
    end if;
    v_addons_price := 0;
    v_seen_addons := array[]::text[];
    for v_addon in select value from jsonb_array_elements(v_addons)
    loop
      v_addon_label := nullif(btrim(coalesce(v_addon ->> 'label', '')), '');
      if v_addon_label is null or v_addon_label = any(v_seen_addons) then
        raise exception using errcode = '22023', message = 'Product add-ons are invalid.';
      end if;
      select value into v_variant
      from jsonb_array_elements(coalesce(v_product.addons, '[]'::jsonb))
      where value ->> 'label' = v_addon_label
      limit 1;
      if not found then
        raise exception using errcode = 'P0001', message = format('An add-on for “%s” is no longer available.', v_product.name);
      end if;
      begin v_addon_price := coalesce((v_variant ->> 'price')::integer, 0); exception when others then
        raise exception using errcode = '22023', message = 'A product add-on has an invalid price.';
      end;
      if coalesce((v_addon ->> 'price')::integer, -1) <> v_addon_price then
        raise exception using errcode = 'P0001', message = format('The price of an add-on for “%s” changed. Please review your basket.', v_product.name);
      end if;
      v_addons_price := v_addons_price + v_addon_price;
      v_seen_addons := array_append(v_seen_addons, v_addon_label);
    end loop;

    if v_unit_price <> v_product.price + v_variant_price + v_addons_price then
      raise exception using errcode = 'P0001', message = format('The price of “%s” changed. Please review your basket.', v_product.name);
    end if;
    v_expected_discount := v_expected_discount + v_line_total;
    update public.products set stock = stock - v_qty, updated_at = now() where id = v_product.id;
  end loop;

  if v_expected_discount <> v_subtotal then
    raise exception using errcode = '22023', message = 'Checkout subtotal could not be verified.';
  end if;

  v_order_id := nullif(btrim(coalesce(p_order ->> 'id', '')), '');
  if v_order_id is null or length(v_order_id) > 120 then
    raise exception using errcode = '22023', message = 'Checkout reference is invalid.';
  end if;

  begin
    insert into public.orders (
      id, status, subtotal, discount, coupon, delivery_charge, total,
      customer_name, customer_phone, customer_email, customer_address,
      customer_landmark, customer_city, customer_pincode, gift_note,
      gift_occasion, gift_delivery_date, gift_sender_name, gift_surprise,
      payment_method, payment_status, source, timeline, user_id,
      tracking_token_hash, tracking_token_ciphertext, client_request_id
    ) values (
      v_order_id, 'pending', v_subtotal, v_discount,
      case when v_coupon_code is null then null else to_jsonb(v_coupon_code) end,
      v_delivery, v_total, v_name, v_phone, v_email, v_address,
      v_landmark, v_city, v_pincode, v_gift_note, v_gift_occasion,
      v_gift_date, v_sender_name, coalesce((p_order ->> 'gift_surprise')::boolean, false),
      v_payment_method, 'pending', v_source,
      jsonb_build_array(jsonb_build_object(
        'at', v_created_at,
        'status', 'pending',
        'note', case when v_payment_method = 'UPI' then 'Awaiting UPI payment confirmation' else 'Order placed' end
      )),
      p_user_id, v_tracking_hash, v_tracking_ciphertext, v_request_id
    );
  exception when unique_violation then
    -- A global historic request-id index exists. Return only a matching own order;
    -- never disclose a different customer's order if an astronomically unlikely
    -- request-id collision occurs.
    select id, total into v_existing_id, v_existing_total
    from public.orders
    where user_id = p_user_id and client_request_id = v_request_id
    limit 1;
    if found then
      return query select v_existing_id, v_existing_total, true;
      return;
    end if;
    raise exception using errcode = 'P0001', message = 'We could not safely create this order. Please try again.';
  end;

  insert into public.order_items (
    id, order_id, product_id, slug, name, image, occasion,
    unit_price, base_price, variant, addons, qty, line_total
  )
  select
    gen_random_uuid(), v_order_id, p.id, p.slug, p.name, p.image, p.occasion,
    (line.value ->> 'unit_price')::integer, p.price,
    nullif(btrim(coalesce(line.value ->> 'variant', '')), ''),
    coalesce(line.value -> 'addons', '[]'::jsonb),
    (line.value ->> 'qty')::integer, (line.value ->> 'line_total')::integer
  from jsonb_array_elements(p_items) as line(value)
  join public.products p on p.id = (line.value ->> 'product_id')::uuid;

  if v_coupon_code is not null then
    update public.coupons set uses = coalesce(uses, 0) + 1 where code = v_coupon_code;
  end if;

  insert into public.customers (
    phone, name, email, city, pincode, order_count, total_spend, first_order_at, last_order_at
  ) values (
    v_phone, v_name, v_email, v_city, v_pincode, 1, v_total, v_created_at, v_created_at
  )
  on conflict (phone) do update set
    name = excluded.name,
    email = coalesce(nullif(excluded.email, ''), public.customers.email),
    city = excluded.city,
    pincode = excluded.pincode,
    order_count = coalesce(public.customers.order_count, 0) + 1,
    total_spend = coalesce(public.customers.total_spend, 0) + excluded.total_spend,
    last_order_at = excluded.last_order_at;

  return query select v_order_id, v_total, false;
end;
$$;

revoke all on function public.taj_create_account_order(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.taj_create_account_order(uuid, jsonb, jsonb) to service_role;

-- Use this function from the private admin route when an order is cancelled. It
-- row-locks the order and each affected product, so concurrent double-clicks or
-- separate staff sessions cannot restock the same item twice.
create or replace function public.taj_cancel_order(
  p_order_id text,
  p_note text default null
)
returns table(already_cancelled boolean, order_timeline jsonb)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_order public.orders%rowtype;
  v_line record;
  v_timeline jsonb;
  v_note text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Order not found.';
  end if;
  if v_order.status = 'delivered' then
    raise exception using errcode = 'P0001', message = 'A delivered order cannot be cancelled. Record a refund separately if needed.';
  end if;
  if v_order.status = 'cancelled' then
    return query select true, coalesce(v_order.timeline, '[]'::jsonb);
    return;
  end if;

  for v_line in
    select product_id, sum(qty)::integer as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  loop
    perform 1 from public.products where id = v_line.product_id for update;
    if found then
      update public.products set stock = coalesce(stock, 0) + v_line.qty, updated_at = now() where id = v_line.product_id;
    end if;
  end loop;

  v_note := left(coalesce(nullif(btrim(p_note), ''), 'Cancelled by studio'), 500);
  v_timeline := coalesce(v_order.timeline, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('at', now(), 'status', 'cancelled', 'note', v_note)
  );
  update public.orders set status = 'cancelled', timeline = v_timeline where id = p_order_id;
  return query select false, v_timeline;
end;
$$;

revoke all on function public.taj_cancel_order(text, text) from public, anon, authenticated;
grant execute on function public.taj_cancel_order(text, text) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- done
-- ─────────────────────────────────────────────────────────────────────────────
