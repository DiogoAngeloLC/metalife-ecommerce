-- ============================================================
-- 0011_official_store_variants_b2b.sql
-- Loja Oficial Metalife: códigos Protheus + campos B2B
-- ============================================================

-- listing_variants: códigos Protheus
ALTER TABLE public.listing_variants
  ADD COLUMN IF NOT EXISTS str_code text,
  ADD COLUMN IF NOT EXISTS stf_code text,
  ADD COLUMN IF NOT EXISTS protheus_code text;

-- orders: dados fiscais B2B
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS buyer_company_name text,
  ADD COLUMN IF NOT EXISTS buyer_state_registration text;

-- order_items: snapshots Protheus
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS protheus_code_snapshot text,
  ADD COLUMN IF NOT EXISTS str_code_snapshot text,
  ADD COLUMN IF NOT EXISTS stf_code_snapshot text;
