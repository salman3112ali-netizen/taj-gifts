-- Taj Gifts production commerce hardening: paid funds must be recorded as refunded
-- before cancellation can restock inventory. Deterministic product locking also
-- avoids a deadlock when two staff accounts cancel overlapping orders together.

create or replace function public.taj_cancel_order(p_order_id text, p_note text default null)
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
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

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

  if v_order.payment_status = 'paid' then
    raise exception using errcode = 'P0001', message = 'Record the refund before cancelling a paid order.';
  end if;

  -- Consistent product order prevents two concurrent cancellations from locking
  -- the same stock rows in opposite order.
  for v_line in
    select product_id, sum(qty)::integer as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
    order by product_id
  loop
    perform 1 from public.products where id = v_line.product_id for update;
    if found then
      update public.products
      set stock = coalesce(stock, 0) + v_line.qty,
          updated_at = now()
      where id = v_line.product_id;
    end if;
  end loop;

  v_note := left(coalesce(nullif(btrim(p_note), ''), 'Cancelled by studio'), 500);
  v_timeline := coalesce(v_order.timeline, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('at', now(), 'status', 'cancelled', 'note', v_note)
  );

  update public.orders
  set status = 'cancelled', timeline = v_timeline
  where id = p_order_id;

  return query select false, v_timeline;
end;
$$;

revoke all on function public.taj_cancel_order(text, text) from public, anon, authenticated;
grant execute on function public.taj_cancel_order(text, text) to service_role;
