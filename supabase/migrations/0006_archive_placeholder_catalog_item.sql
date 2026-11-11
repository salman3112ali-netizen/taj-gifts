-- A prototype placeholder was accidentally public in the live catalogue as a
-- ₹1 product named “Hassu” with the description “Nothing”. Archive it safely:
-- retain the row for auditability while removing it from customer discovery and
-- preventing any sale.

update public.products p
set published = false,
    stock = 0,
    updated_at = now()
where p.slug = 'hassu'
  and p.name = 'Hassu'
  and p.price = 1
  and p.description = 'Nothing'
  and p.published = true
  and not exists (
    select 1 from public.order_items i where i.product_id = p.id
  );
