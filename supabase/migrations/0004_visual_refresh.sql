-- 0004_visual_refresh.sql
-- Colunas para redesign visual: vendedor verificado + anúncio em destaque

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_vendors_verified ON public.vendors(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(is_featured) WHERE is_featured = true;
