-- DEPENDÊNCIA: as policies neste arquivo usam public.is_admin(auth.uid())
-- que é definida em 0006_is_admin_function.sql.
-- Em deploy from scratch, 0005 roda ANTES de 0006 (ordem alfabética).
-- A migration 0006 recria todas as policies com DROP/CREATE para resolver isso.
-- Se aplicando manualmente, rode 0006 LOGO APÓS 0005.

-- 1. site_settings (key-value pra configs editáveis)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings_admin_write" ON public.site_settings;
CREATE POLICY "site_settings_admin_write" ON public.site_settings
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2. legal_pages (política, termos, etc)
CREATE TABLE IF NOT EXISTS public.legal_pages (
  slug text PRIMARY KEY,
  title text NOT NULL,
  content_md text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legal_pages_public_read" ON public.legal_pages;
CREATE POLICY "legal_pages_public_read" ON public.legal_pages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "legal_pages_admin_write" ON public.legal_pages;
CREATE POLICY "legal_pages_admin_write" ON public.legal_pages
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. ad_banners (slots de banner)
CREATE TABLE IF NOT EXISTS public.ad_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  alt_text text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ad_banners_slot ON public.ad_banners(slot_key) WHERE active = true;

ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_banners_public_read" ON public.ad_banners;
CREATE POLICY "ad_banners_public_read" ON public.ad_banners
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "ad_banners_admin_all" ON public.ad_banners;
CREATE POLICY "ad_banners_admin_all" ON public.ad_banners
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. Seeds defaults
INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{
    "image_url": null,
    "eyebrow": "Metalife Pilates",
    "title": "Equipamentos de Pilates com a qualidade Metalife.",
    "subtitle": "Reformers, Cadillacs, Chairs e acessórios. Anúncios verificados, contato direto pelo WhatsApp."
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.legal_pages (slug, title, content_md) VALUES
  ('politica-de-privacidade', 'Política de Privacidade',
'# Política de Privacidade

Última atualização: [data]

## 1. Coleta de dados

[Editar via painel admin]

## 2. Uso dos dados

[...]

## 3. Compartilhamento

[...]

## 4. Direitos do titular (LGPD)

[...]

## 5. Contato

[...]'),

  ('termos-de-uso', 'Termos de Uso',
'# Termos de Uso

Última atualização: [data]

## 1. Sobre o serviço

O Classificado Pilates é uma plataforma de classificados que conecta vendedores e compradores de equipamentos de Pilates. **Não somos parte da transação.** Não mediamos compras, não realizamos pagamentos, não cuidamos de frete e não garantimos a qualidade dos equipamentos anunciados.

## 2. Responsabilidades

[Editar via painel admin]

## 3. Conduta no marketplace

[...]

## 4. Limitação de responsabilidade

[...]')
ON CONFLICT (slug) DO NOTHING;

-- 5. Storage bucket pra assets do site
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "site_assets_public_read" ON storage.objects;
CREATE POLICY "site_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "site_assets_admin_write" ON storage.objects;
CREATE POLICY "site_assets_admin_write" ON storage.objects
  FOR ALL USING (
    bucket_id = 'site-assets' AND public.is_admin(auth.uid())
  );
