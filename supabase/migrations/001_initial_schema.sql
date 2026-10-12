-- DOWNFALL Atelier Database Migration
-- Target: Supabase (PostgreSQL 15+)
-- Environment: "Automatically expose new tables" disabled, Automatic RLS enabled
-- Note: Wrapped in a transaction to prevent partial execution on failure.

begin;

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 2. SCHEMA PRIVILEGES
-- Explicitly grant schema usage since "Automatically expose new tables" is off
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;

-- ============================================================================
-- 3. TABLES DEFINITION
-- ============================================================================

-- 3a. Products Catalog Table
create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text default '',
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'USD',
  category text not null check (category in ('basics', 'formal', 'luxury')),
  status text not null default 'draft' check (status in ('published', 'draft', 'archived')),
  is_demo_price boolean not null default true,
  images jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Storefront lookup indexes
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_slug on public.products(slug);

-- 3b. Authorized Admin Users Table
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz default now()
);

-- 3c. Shared Persistent Rate Limiting Table (Cross-instance serverless lockout)
create table if not exists public.auth_rate_limits (
  identifier text primary key,
  attempts integer not null default 0,
  locked_until bigint not null default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_auth_rate_limits_locked on public.auth_rate_limits(locked_until);

-- ============================================================================
-- 4. TABLE-LEVEL PERMISSIONS (PostgREST Exposure)
-- Explicit permissions required when "Automatically expose new tables" is disabled
-- ============================================================================

-- Products table:
-- Storefront (anon & authenticated) can SELECT.
-- Admins (authenticated) can INSERT and DELETE.
-- Direct UPDATE is REVOKED from authenticated to prevent bypassing version checks.
-- Every normal admin update MUST use public.update_product_atomic().
revoke all on public.products from public;
grant select on public.products to anon, authenticated;
grant insert, delete on public.products to authenticated;
revoke update on public.products from public, anon, authenticated;
grant all on public.products to service_role;

-- Admin Users table:
-- Anon is strictly denied any table access.
-- Authenticated users have table access subject to strict admin RLS check.
-- Service role has full administrative access.
revoke all on public.admin_users from public, anon;
grant select, insert, update, delete on public.admin_users to authenticated;
grant all on public.admin_users to service_role;

-- Auth Rate Limits table:
-- Directly inaccessible to anon and ordinary authenticated clients (service_role only).
-- Rate limiting is performed through server-side service role or restricted RPC.
revoke all on public.auth_rate_limits from public, anon, authenticated;
grant all on public.auth_rate_limits to service_role;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.products enable row level security;
alter table public.admin_users enable row level security;
alter table public.auth_rate_limits enable row level security;

-- 5a. Non-Recursive Admin Authorization Function
-- Safe, fixed search_path = public, pg_temp protects against search_path hijacking.
-- SECURITY DEFINER allows checking admin_users without infinite RLS recursion.
-- Strictly validates role = 'admin', not merely row existence.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Function permissions for is_admin:
-- Storefront and auth users need execute to evaluate RLS policies; cannot escalate privileges.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- 5b. Products RLS Policies
-- Public (anonymous & authenticated) can only read PUBLISHED products
drop policy if exists "Public storefront can view published products" on public.products;
create policy "Public storefront can view published products"
  on public.products
  for select
  using (status = 'published');

-- Authorized admins have full management access
drop policy if exists "Admins have full product management access" on public.products;
create policy "Admins have full product management access"
  on public.products
  for all
  using (
    auth.role() = 'authenticated' and
    public.is_admin()
  )
  with check (
    auth.role() = 'authenticated' and
    public.is_admin()
  );

-- 5c. Admin Users RLS Policies
-- Non-recursive policy using security definer is_admin() checking role = 'admin'
-- Ordinary users cannot read, create, or alter admin records.
drop policy if exists "Admins can view admin list" on public.admin_users;
create policy "Admins can view admin list"
  on public.admin_users
  for select
  using (
    auth.role() = 'authenticated' and
    public.is_admin()
  );

drop policy if exists "Admins can manage admin list" on public.admin_users;
create policy "Admins can manage admin list"
  on public.admin_users
  for all
  using (
    auth.role() = 'authenticated' and
    public.is_admin()
  )
  with check (
    auth.role() = 'authenticated' and
    public.is_admin()
  );

-- 5d. Rate Limits RLS Policy
-- No public policies created for auth_rate_limits; only accessible via service_role key.

-- ============================================================================
-- 6. PRIVILEGED FUNCTIONS (Secured & Restricted)
-- ============================================================================

-- 6a. Atomic Rate Limiting Function
-- Atomically increments attempt counter and manages lockout window in a single database transaction.
-- Safe, fixed search_path = public, pg_temp.
-- PRESERVES active locked_until value: additional attempts during lockout are rejected without extending expiry.
-- Restricted to service_role so ordinary users cannot tamper with or bypass rate limits.
create or replace function public.increment_auth_rate_limit(
  p_identifier text,
  p_max_attempts int default 5,
  p_lockout_window_ms bigint default 900000,
  p_now bigint default 0
)
returns table (
  attempts int,
  locked boolean,
  locked_until bigint,
  remaining_attempts int,
  remaining_ms bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now bigint := case when p_now > 0 then p_now else (extract(epoch from clock_timestamp()) * 1000)::bigint end;
  v_row public.auth_rate_limits%rowtype;
  v_locked_until bigint := 0;
  v_is_locked boolean := false;
  v_remaining_attempts int := 0;
  v_remaining_ms bigint := 0;
begin
  insert into public.auth_rate_limits (identifier, attempts, locked_until, updated_at)
  values (p_identifier, 1, 0, now())
  on conflict (identifier) do update
  set attempts = case
        -- 1. If previous lockout expired, reset attempts to 1
        when auth_rate_limits.locked_until > 0 and v_now > auth_rate_limits.locked_until then 1
        -- 2. Otherwise increment attempt counter
        else auth_rate_limits.attempts + 1
      end,
      locked_until = case
        -- 1. If previous lockout expired, reset locked_until to 0
        when auth_rate_limits.locked_until > 0 and v_now > auth_rate_limits.locked_until then 0
        -- 2. PRESERVE ACTIVE LOCKOUT: Do NOT extend existing expiry upon subsequent attempts
        when auth_rate_limits.locked_until > v_now then auth_rate_limits.locked_until
        -- 3. If freshly reaching or exceeding max attempts, trigger new lockout window
        when (auth_rate_limits.attempts + 1) >= p_max_attempts then (v_now + p_lockout_window_ms)
        -- 4. Otherwise keep 0
        else 0
      end,
      updated_at = now()
  returning * into v_row;

  -- Handle case where single inserted row already meets threshold (e.g. p_max_attempts = 1)
  if v_row.attempts >= p_max_attempts and v_row.locked_until = 0 then
    v_locked_until := v_now + p_lockout_window_ms;
    update public.auth_rate_limits
    set locked_until = v_locked_until
    where identifier = p_identifier
    returning * into v_row;
  end if;

  v_is_locked := v_row.locked_until > v_now;
  v_remaining_ms := case when v_is_locked then (v_row.locked_until - v_now) else 0 end;
  v_remaining_attempts := case when v_is_locked then 0 else greatest(0, p_max_attempts - v_row.attempts) end;

  return query select v_row.attempts, v_is_locked, v_row.locked_until, v_remaining_attempts, v_remaining_ms;
end;
$$;

-- Restrict privileged rate limit function execution to service_role only
revoke execute on function public.increment_auth_rate_limit(text, int, bigint, bigint) from public, anon, authenticated;
grant execute on function public.increment_auth_rate_limit(text, int, bigint, bigint) to service_role;

-- 6b. Atomic Product Concurrency Check and Update Function
-- Atomically checks version with row-level lock (FOR UPDATE), increments version, and applies updates.
-- Safe, fixed search_path = public, pg_temp.
-- Requires non-null p_expected_version; passing null raises an immediate error to prevent bypassing conflict detection.
-- Explicitly validates administrator authorization inside the function so ordinary users cannot modify products.
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
    images = case when p_payload ? 'images' then p_payload->'images' else images end,
    variants = case when p_payload ? 'variants' then p_payload->'variants' else variants end,
    version = version + 1,
    updated_at = now()
  where id = p_id
  returning * into v_updated;

  return v_updated;
end;
$$;

-- Restrict atomic update execution: ordinary anonymous users are completely revoked.
-- Authenticated clients and service_role can call, and internal admin check enforces authorization.
revoke execute on function public.update_product_atomic(text, int, jsonb) from public, anon;
grant execute on function public.update_product_atomic(text, int, jsonb) to authenticated, service_role;

-- ============================================================================
-- 7. STORAGE BUCKET CONFIGURATION & RLS
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do nothing;

-- Storage RLS: Public can view images
drop policy if exists "Public image access" on storage.objects;
create policy "Public image access"
  on storage.objects
  for select
  using (bucket_id = 'catalog-images');

-- Storage RLS: Only authorized admins can upload/modify images
drop policy if exists "Admin image upload" on storage.objects;
create policy "Admin image upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'catalog-images' and
    auth.role() = 'authenticated' and
    public.is_admin()
  );

drop policy if exists "Admin image delete" on storage.objects;
create policy "Admin image delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'catalog-images' and
    auth.role() = 'authenticated' and
    public.is_admin()
  );

commit;
