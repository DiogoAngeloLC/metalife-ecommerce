-- ============================================================
-- 0013_order_access_token.sql
-- Blindagem LGPD: token de acesso ao pedido + RLS sem SELECT anon
-- ============================================================

-- Token opaco para links de confirmação (guest checkout)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS access_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_access_token
  ON public.orders (access_token);

-- Upsert de variantes por SKU no importador admin
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_variants_listing_sku
  ON public.listing_variants (listing_id, sku)
  WHERE sku IS NOT NULL AND btrim(sku) <> '';

-- ---------- RLS: anon nunca lista pedidos ----------
REVOKE ALL ON TABLE public.orders FROM anon;
REVOKE ALL ON TABLE public.order_items FROM anon;

-- Reabilita apenas INSERT de checkout (guest) em orders
GRANT INSERT ON TABLE public.orders TO anon;
GRANT INSERT ON TABLE public.order_items TO anon;
-- authenticated mantém usos legítimos via policies
GRANT SELECT, INSERT, UPDATE ON TABLE public.orders TO authenticated;
GRANT SELECT, INSERT ON TABLE public.order_items TO authenticated;

-- Remove UPDATE aberto que permitia anon alterar qualquer pending_payment
DROP POLICY IF EXISTS "Update pending orders payment fields" ON public.orders;

-- Buyer autenticado pode atualizar o próprio pedido pendente (ex.: dados de pagamento)
DROP POLICY IF EXISTS "Buyer updates own pending payment" ON public.orders;
CREATE POLICY "Buyer updates own pending payment"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() AND status = 'pending_payment')
  WITH CHECK (
    buyer_id = auth.uid()
    AND status IN ('pending_payment', 'paid', 'canceled')
  );

-- Anexa pagamento via SECURITY DEFINER (checkout guest / server action sem service role)
CREATE OR REPLACE FUNCTION public.attach_order_payment(
  p_order_id uuid,
  p_status text,
  p_external_payment_id text DEFAULT NULL,
  p_payment_provider text DEFAULT NULL,
  p_payment_payload jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('pending_payment', 'paid', 'canceled') THEN
    RETURN false;
  END IF;

  UPDATE public.orders
  SET
    status = p_status,
    external_payment_id = COALESCE(p_external_payment_id, external_payment_id),
    payment_provider = COALESCE(p_payment_provider, payment_provider),
    payment_payload = COALESCE(p_payment_payload, payment_payload),
    updated_at = now()
  WHERE id = p_order_id
    AND status = 'pending_payment';

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_order_payment(uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_order_payment(uuid, text, text, text, jsonb)
  TO anon, authenticated, service_role;

-- Confirmação: exige token OU comprador autenticado OU admin
DROP FUNCTION IF EXISTS public.get_order_confirmation(text);

CREATE OR REPLACE FUNCTION public.get_order_confirmation(
  p_order_number text,
  p_access_token uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders%ROWTYPE;
  allowed boolean := false;
  result jsonb;
BEGIN
  SELECT * INTO o
  FROM public.orders
  WHERE order_number = p_order_number;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF p_access_token IS NOT NULL AND o.access_token = p_access_token THEN
    allowed := true;
  ELSIF auth.uid() IS NOT NULL AND o.buyer_id = auth.uid() THEN
    allowed := true;
  ELSIF public.is_admin(auth.uid()) THEN
    allowed := true;
  END IF;

  IF NOT allowed THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'order', jsonb_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'status', o.status,
      'payment_method', o.payment_method,
      'payment_provider', o.payment_provider,
      'external_payment_id', o.external_payment_id,
      'total_cents', o.total_cents,
      'payment_payload', o.payment_payload,
      'shipping_address', o.shipping_address,
      'buyer_id', o.buyer_id
    ),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id,
        'title_snapshot', i.title_snapshot,
        'quantity', i.quantity,
        'total_cents', i.total_cents
      ) ORDER BY i.created_at)
      FROM public.order_items i
      WHERE i.order_id = o.id
    ), '[]'::jsonb)
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_confirmation(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_confirmation(text, uuid)
  TO anon, authenticated, service_role;

-- Garante que policies de SELECT em orders/order_items NÃO incluem anon
-- (recria buyer/vendor/admin; sem política para role anon)
DROP POLICY IF EXISTS "Buyer reads own orders" ON public.orders;
CREATE POLICY "Buyer reads own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Vendor reads own store orders" ON public.orders;
CREATE POLICY "Vendor reads own store orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Read order_items via parent order" ON public.order_items;
CREATE POLICY "Read order_items via parent order"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.buyer_id = auth.uid()
          OR o.vendor_id = auth.uid()
          OR public.is_admin(auth.uid())
        )
    )
  );
