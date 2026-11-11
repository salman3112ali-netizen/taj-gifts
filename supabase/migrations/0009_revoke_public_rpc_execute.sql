-- 0009_revoke_public_rpc_execute.sql
-- Purpose: stop anonymous internet callers from reaching the owner/admin
-- surface and from listing private business tables.
--
-- Before this migration every function in `public` carried PostgreSQL's
-- default EXECUTE grant to PUBLIC, which includes the `anon` and
-- `authenticated` API roles. That meant anyone holding the public anon key
-- (which is printed in the browser bundle by design) could POST to
-- /rest/v1/rpc/admin_orders, admin_customers, admin_save_settings, and so on.
-- The only things standing in the way were a session token argument and a
-- per-instance login rate limit.
--
-- After this migration:
--   * admin_* functions  -> service_role only (our server routes)
--   * claim_* + deletion -> authenticated only (real signed-in customers)
--   * trigger helpers    -> nobody (they run as triggers, not through the API)
--   * order engine       -> service_role only (server routes call it)
--   * coupons table      -> no longer world-readable
--
-- Safe to run on live data: no rows are touched, no objects are dropped
-- except the one over-broad SELECT policy on coupons.

begin;

-- ---------------------------------------------------------------- coupons --
-- Every active gift code was readable with the public anon key. Gift codes
-- are a marketing asset, and a public list also lets a coupon be scraped the
-- moment it is created. Only the server needs this table.
drop policy if exists coupons_public_read on public.coupons;
revoke all on table public.coupons from anon, authenticated;

-- Defense in depth for tables that already had RLS with no policies.
revoke all on table public.leads from anon, authenticated;
revoke all on table public.subscribers from anon, authenticated;
revoke all on table public.customers from anon, authenticated;
revoke all on table public.delivery_otps from anon, authenticated;

-- ------------------------------------------------------------ admin_* RPCs --
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'admin\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end
$$;

-- ------------------------------------------- customer-callable auth helpers --
-- These read auth.uid() themselves and must stay callable by a signed-in
-- customer, but never by an anonymous visitor.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('claim_order', 'claim_my_orders', 'request_account_deletion')
  loop
    execute format('revoke all on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated, service_role', r.sig);
  end loop;
end
$$;

-- ------------------------------------------------- trigger-only functions --
-- Executing a trigger function through PostgREST has no legitimate use.
-- (PostgreSQL checks trigger-function EXECUTE when the trigger is created,
--  not when it fires, so removing these grants does not affect inserts.)
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('handle_new_user', 'link_order_to_account', 'touch_updated_at')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end
$$;

-- ------------------------------------------------------ order / money engine --
-- All of these are called by our own server routes with the service role.
-- None of them may be reachable from a browser or the mobile client directly.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'taj_create_account_order',
        'taj_customer_cancel_order',
        'taj_cancel_order',
        'taj_rate_limit',
        'taj_coupon_check',
        'taj_refresh_customer_ledger',
        'taj_refresh_product_review_metrics',
        'taj_sync_product_review_metrics',
        'taj_verify_customer_review'
      )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end
$$;

-- ------------------------------------------------- future-proofing the schema --
-- Any function created later in `public` by the postgres role should start
-- closed, not world-executable. Server code can always be granted explicitly.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public grant execute on functions to service_role;

commit;
