-- Políticas de Storage para admins no bucket listing-images.
-- Permite INSERT/UPDATE/DELETE autenticado quando public.is_admin(auth.uid()).
-- O painel admin usa service_role (bypass RLS); estas policies cobrem upload
-- direto no cliente e formulários autenticados de vendedor/admin.

-- Limite de arquivo alinhado ao bodySizeLimit das Server Actions (10mb)
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'listing-images';

DROP POLICY IF EXISTS "Admins manage listing images" ON storage.objects;
CREATE POLICY "Admins manage listing images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND public.is_admin(auth.uid())
  );
