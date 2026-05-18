-- Função is_admin(uid) usada por RLS policies em várias tabelas.
--
-- NOTA: Supabase CLI roda migrations em ordem alfabética, portanto
-- 0005 roda ANTES de 0006. As policies em 0005 que dependem de is_admin()
-- causariam erro em deploy from scratch. Esta migration resolve isso
-- recriando todas as policies dependentes com DROP IF EXISTS + CREATE.

-- 1. Função
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_admins WHERE user_id = uid
  );
$$;

COMMENT ON FUNCTION public.is_admin(uuid) IS
  'Retorna true se o user_id pertence à tabela app_admins. Usado em RLS policies.';

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon, service_role;

-- 2. Re-aplicar policies da migration 0005 que dependem da função
-- (idempotente: DROP IF EXISTS antes de CREATE)

-- site_settings
DROP POLICY IF EXISTS "site_settings_admin_write" ON public.site_settings;
CREATE POLICY "site_settings_admin_write" ON public.site_settings
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- legal_pages
DROP POLICY IF EXISTS "legal_pages_admin_write" ON public.legal_pages;
CREATE POLICY "legal_pages_admin_write" ON public.legal_pages
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ad_banners
DROP POLICY IF EXISTS "ad_banners_admin_all" ON public.ad_banners;
CREATE POLICY "ad_banners_admin_all" ON public.ad_banners
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Bucket site-assets (storage policy)
DROP POLICY IF EXISTS "site_assets_admin_write" ON storage.objects;
CREATE POLICY "site_assets_admin_write" ON storage.objects
  FOR ALL USING (
    bucket_id = 'site-assets' AND public.is_admin(auth.uid())
  );
