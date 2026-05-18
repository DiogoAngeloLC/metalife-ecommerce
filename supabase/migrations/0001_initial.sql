-- ============================================================
-- REFORMA — Schema inicial
-- ============================================================
-- Ordem: extensões → tabelas → indexes → triggers → RLS → storage
-- ============================================================

-- ---------- Extensões ----------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------- Função genérica: set updated_at ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABELA: vendors (1:1 com auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text,
  whatsapp              text,
  city                  text,
  state                 text,
  onboarding_completed  boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS vendors_set_updated_at ON public.vendors;
CREATE TRIGGER vendors_set_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Trigger: criar vendor row em todo signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.vendors (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABELA: listings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  slug              text NOT NULL UNIQUE,
  title             text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description       text,
  equipment_type    text NOT NULL,
  brand             text,
  year              int CHECK (year IS NULL OR (year BETWEEN 1980 AND 2099)),
  condition         text NOT NULL CHECK (condition IN ('novo','seminovo','usado_bom','usado_regular')),
  has_fixed_price   boolean NOT NULL DEFAULT false,
  price             numeric(10,2) CHECK (price IS NULL OR price >= 0),
  is_negotiable     boolean NOT NULL DEFAULT true,
  city              text NOT NULL,
  state             text NOT NULL CHECK (char_length(state) = 2),
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','sold')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  published_at      timestamptz,
  -- Coerência: se has_fixed_price = true, price deve estar presente
  CONSTRAINT price_required_when_fixed CHECK (
    has_fixed_price = false OR price IS NOT NULL
  )
);

DROP TRIGGER IF EXISTS listings_set_updated_at ON public.listings;
CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON public.listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_vendor          ON public.listings(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_city_state      ON public.listings(state, city) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_equipment_trgm  ON public.listings USING gin (equipment_type gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_brand_trgm      ON public.listings USING gin (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm      ON public.listings USING gin (title gin_trgm_ops);

-- ============================================================
-- TABELA: listing_images
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  position      int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON public.listing_images(listing_id, position);

-- ============================================================
-- TABELA: leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  name              text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  whatsapp          text NOT NULL,
  email             text NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','validated','sent','failed')),
  whatsapp_sent_at  timestamptz,
  ip_address        text,
  user_agent        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_listing_created  ON public.leads(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_created ON public.leads(whatsapp, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_ip_created       ON public.leads(ip_address, created_at DESC) WHERE ip_address IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.vendors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads          ENABLE ROW LEVEL SECURITY;

-- ---------- vendors ----------
-- Vendor lê/edita o próprio perfil
DROP POLICY IF EXISTS "Vendor reads own profile" ON public.vendors;
CREATE POLICY "Vendor reads own profile"
  ON public.vendors FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Vendor updates own profile" ON public.vendors;
CREATE POLICY "Vendor updates own profile"
  ON public.vendors FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT é feito pelo trigger handle_new_user (SECURITY DEFINER), não precisa policy.
-- DELETE bloqueado (cascata de auth.users via FK ON DELETE CASCADE).

-- ---------- listings ----------
-- Público vê apenas anúncios ativos
DROP POLICY IF EXISTS "Public sees active listings" ON public.listings;
CREATE POLICY "Public sees active listings"
  ON public.listings FOR SELECT
  USING (status = 'active');

-- Vendor vê os próprios em qualquer status
DROP POLICY IF EXISTS "Vendor sees own listings" ON public.listings;
CREATE POLICY "Vendor sees own listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendor creates own listings" ON public.listings;
CREATE POLICY "Vendor creates own listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendor updates own listings" ON public.listings;
CREATE POLICY "Vendor updates own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendor deletes own listings" ON public.listings;
CREATE POLICY "Vendor deletes own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (vendor_id = auth.uid());

-- ---------- listing_images ----------
-- Público vê imagens de anúncios ativos
DROP POLICY IF EXISTS "Public sees images of active listings" ON public.listing_images;
CREATE POLICY "Public sees images of active listings"
  ON public.listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id AND l.status = 'active'
    )
  );

-- Vendor vê/edita imagens dos próprios listings
DROP POLICY IF EXISTS "Vendor manages images of own listings" ON public.listing_images;
CREATE POLICY "Vendor manages images of own listings"
  ON public.listing_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id AND l.vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id AND l.vendor_id = auth.uid()
    )
  );

-- ---------- leads ----------
-- Qualquer um (anônimo) pode submeter lead em listing ativo
DROP POLICY IF EXISTS "Anyone submits leads to active listings" ON public.leads;
CREATE POLICY "Anyone submits leads to active listings"
  ON public.leads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = leads.listing_id AND l.status = 'active'
    )
  );

-- Vendor lê leads dos próprios listings
DROP POLICY IF EXISTS "Vendor reads own leads" ON public.leads;
CREATE POLICY "Vendor reads own leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = leads.listing_id AND l.vendor_id = auth.uid()
    )
  );

-- UPDATE só por service_role (Edge Function que dispara WhatsApp).
-- Nenhuma policy de UPDATE pra authenticated/anon = bloqueado.

-- ============================================================
-- STORAGE — bucket de imagens
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (path pattern: {user_id}/{listing_id}/{file})
DROP POLICY IF EXISTS "Public reads listing images" ON storage.objects;
DROP POLICY IF EXISTS "Auth uploads to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Auth updates own images" ON storage.objects;
DROP POLICY IF EXISTS "Auth deletes own images" ON storage.objects;

CREATE POLICY "Public reads listing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "Auth uploads to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Auth updates own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Auth deletes own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- FIM
-- ============================================================
