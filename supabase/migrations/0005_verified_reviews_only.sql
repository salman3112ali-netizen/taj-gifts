-- Reviews are customer trust signals, not catalogue fields. Rebuild every product
-- aggregate from moderated, order-linked reviews and prevent unverified self-published
-- ratings from reaching customers or structured data.

alter table public.reviews alter column user_id set not null;
alter table public.reviews alter column order_id set not null;
alter table public.reviews alter column published set default false;

do $$ begin
  alter table public.reviews add constraint reviews_rating_range_check check (rating between 1 and 5);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.reviews add constraint reviews_body_length_check check (char_length(btrim(body)) between 20 and 1500);
exception when duplicate_object then null; end $$;

create unique index if not exists reviews_one_per_customer_order_product
  on public.reviews(user_id, order_id, product_slug);

create or replace function public.taj_verify_customer_review()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_author text;
begin
  -- Service-role moderation/imports deliberately have no auth.uid() and may set
  -- published=true. A browser-originated write is always an account-owned,
  -- delivered-order review and always returns to moderation on edit.
  if auth.uid() is not null then
    if new.user_id is distinct from auth.uid() then
      raise exception using errcode = '42501', message = 'A review must belong to the signed-in customer.';
    end if;

    if tg_op = 'UPDATE' then
      if new.order_id is distinct from old.order_id or new.product_slug is distinct from old.product_slug then
        raise exception using errcode = '42501', message = 'A review cannot be moved to another order or product.';
      end if;
      new.author := old.author;
    else
      select coalesce(nullif(btrim(full_name), ''), 'Verified customer')
      into v_author
      from public.profiles
      where id = auth.uid();
      new.author := coalesce(v_author, 'Verified customer');
    end if;

    if not exists (
      select 1
      from public.orders o
      join public.order_items i on i.order_id = o.id
      where o.id = new.order_id
        and o.user_id = auth.uid()
        and o.status = 'delivered'
        and i.slug = new.product_slug
    ) then
      raise exception using errcode = '42501', message = 'Reviews are available only for hampers delivered to this account.';
    end if;

    new.published := false;
  end if;

  return new;
end;
$$;

drop trigger if exists taj_reviews_verify_customer_write on public.reviews;
create trigger taj_reviews_verify_customer_write
before insert or update on public.reviews
for each row execute function public.taj_verify_customer_review();
revoke all on function public.taj_verify_customer_review() from public, anon, authenticated;

create or replace function public.taj_refresh_product_review_metrics(p_product_slug text)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.products p
  set reviews = coalesce((
        select count(*)::integer
        from public.reviews r
        where r.product_slug = p_product_slug and r.published = true
      ), 0),
      rating = coalesce((
        select round(avg(r.rating)::numeric, 2)
        from public.reviews r
        where r.product_slug = p_product_slug and r.published = true
      ), 0)
  where p.slug = p_product_slug;
end;
$$;

create or replace function public.taj_sync_product_review_metrics()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if tg_op <> 'INSERT' then
    perform public.taj_refresh_product_review_metrics(old.product_slug);
  end if;
  if tg_op <> 'DELETE' and (tg_op = 'INSERT' or new.product_slug is distinct from old.product_slug) then
    perform public.taj_refresh_product_review_metrics(new.product_slug);
  end if;
  return null;
end;
$$;

drop trigger if exists taj_reviews_sync_product_metrics on public.reviews;
create trigger taj_reviews_sync_product_metrics
after insert or update or delete on public.reviews
for each row execute function public.taj_sync_product_review_metrics();
revoke all on function public.taj_refresh_product_review_metrics(text) from public, anon, authenticated;
revoke all on function public.taj_sync_product_review_metrics() from public, anon, authenticated;

-- Remove seeded/fabricated aggregates and replace them with the actual approved
-- review data. This preserves products and orders while removing false social proof.
update public.products p
set reviews = coalesce(a.review_count, 0),
    rating = coalesce(a.average_rating, 0)
from (
  select p2.id,
         (count(r.id) filter (where r.published = true))::integer as review_count,
         round((avg(r.rating) filter (where r.published = true))::numeric, 2) as average_rating
  from public.products p2
  left join public.reviews r on r.product_slug = p2.slug
  group by p2.id
) a
where p.id = a.id;

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
for insert to authenticated
with check (
  user_id = auth.uid()
  and published = false
  and rating between 1 and 5
  and char_length(btrim(body)) between 20 and 1500
  and exists (
    select 1
    from public.orders o
    join public.order_items i on i.order_id = o.id
    where o.id = reviews.order_id
      and o.user_id = auth.uid()
      and o.status = 'delivered'
      and i.slug = reviews.product_slug
  )
);

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and published = false
  and rating between 1 and 5
  and char_length(btrim(body)) between 20 and 1500
  and exists (
    select 1
    from public.orders o
    join public.order_items i on i.order_id = o.id
    where o.id = reviews.order_id
      and o.user_id = auth.uid()
      and o.status = 'delivered'
      and i.slug = reviews.product_slug
  )
);
