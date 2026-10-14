-- DOWNFALL Atelier Database Migration 002
-- Extends category constraints to support 'bottomwear' and adds explicit made-to-order fields.
-- Target: Supabase (PostgreSQL 15+)
-- Note: Wrapped in a transaction to prevent partial execution on failure.

begin;

-- ============================================================================
-- 1. EXTEND CATEGORY CONSTRAINT
-- ============================================================================
-- Update check constraint on public.products to include 'bottomwear' while preserving existing categories.
alter table public.products 
  drop constraint if exists products_category_check;

alter table public.products 
  add constraint products_category_check 
  check (category in ('basics', 'formal', 'luxury', 'bottomwear'));

-- ============================================================================
-- 2. ADD MADE-TO-ORDER & COMMERCIAL ATTRIBUTE COLUMNS
-- ============================================================================
-- Explicit fulfilment type: 'stocked' or 'made_to_order'
alter table public.products
  add column if not exists fulfilment text not null default 'stocked' 
  check (fulfilment in ('stocked', 'made_to_order'));

-- Boolean flag for made-to-order support
alter table public.products
  add column if not exists is_made_to_order boolean not null default false;

-- Sync check constraint: prevents is_made_to_order from contradicting authoritative fulfilment
alter table public.products
  drop constraint if exists products_fulfilment_sync_check;

alter table public.products
  add constraint products_fulfilment_sync_check
  check ((fulfilment = 'made_to_order' and is_made_to_order = true) or (fulfilment = 'stocked' and is_made_to_order = false));

-- Commercial attributes for publishable items (pending for drafts)
alter table public.products
  add column if not exists production_time text default null;

alter table public.products
  add column if not exists care_instructions text default null;

alter table public.products
  add column if not exists measurements jsonb not null default '[]'::jsonb;

-- Internal atelier product notes and asset management flags
alter table public.products
  add column if not exists reference_note text default null;

alter table public.products
  add column if not exists image_correction_required boolean not null default false;

alter table public.products
  add column if not exists image_correction_note text default null;

-- Storefront index for fulfilment lookup
create index if not exists idx_products_fulfilment on public.products(fulfilment);

-- ============================================================================
-- 3. UPDATE ATOMIC PRODUCT CONCURRENCY AND UPDATE FUNCTION
-- ============================================================================
create or replace function public.update_product_atomic(
  p_id text,
  p_expected_version int,
  p_payload jsonb
)
returns public.products
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_version int;
  v_updated public.products;
  v_new_fulfilment text;
begin
  -- Enforce that caller is either an authorized administrator or the backend service role
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'ACCESS_DENIED: Administrator authorization required to modify catalog';
  end if;

  -- Require expected version to be non-null (prevents bypassing conflict detection)
  if p_expected_version is null then
    raise exception 'INVALID_VERSION: Expected version number is required for atomic product update';
  end if;

  select version into v_current_version
  from public.products
  where id = p_id
  for update;

  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  if v_current_version <> p_expected_version then
    raise exception 'CONCURRENCY_CONFLICT: expected %, found %', p_expected_version, v_current_version;
  end if;

  -- Fulfilment is authoritative; prevent is_made_to_order from contradicting it
  select coalesce(p_payload->>'fulfilment', fulfilment)
  into v_new_fulfilment
  from public.products
  where id = p_id;

  update public.products
  set
    name = coalesce(p_payload->>'name', name),
    slug = coalesce(p_payload->>'slug', slug),
    description = coalesce(p_payload->>'description', description),
    price = case when p_payload ? 'price' then (p_payload->>'price')::numeric else price end,
    currency = coalesce(p_payload->>'currency', currency),
    category = coalesce(p_payload->>'category', category),
    status = coalesce(p_payload->>'status', status),
    is_demo_price = case when p_payload ? 'is_demo_price' then (p_payload->>'is_demo_price')::boolean else is_demo_price end,
    fulfilment = v_new_fulfilment,
    is_made_to_order = (v_new_fulfilment = 'made_to_order'),
    production_time = case when p_payload ? 'production_time' then p_payload->>'production_time' else production_time end,
    care_instructions = case when p_payload ? 'care_instructions' then p_payload->>'care_instructions' else care_instructions end,
    measurements = case when p_payload ? 'measurements' then p_payload->'measurements' else measurements end,
    reference_note = case when p_payload ? 'reference_note' then p_payload->>'reference_note' else reference_note end,
    image_correction_required = case when p_payload ? 'image_correction_required' then (p_payload->>'image_correction_required')::boolean else image_correction_required end,
    image_correction_note = case when p_payload ? 'image_correction_note' then p_payload->>'image_correction_note' else image_correction_note end,
    images = case when p_payload ? 'images' then p_payload->'images' else images end,
    variants = case when p_payload ? 'variants' then p_payload->'variants' else variants end,
    version = version + 1,
    updated_at = now()
  where id = p_id
  returning * into v_updated;

  return v_updated;
end;
$$;

revoke execute on function public.update_product_atomic(text, int, jsonb) from public, anon;
grant execute on function public.update_product_atomic(text, int, jsonb) to authenticated, service_role;

commit;
