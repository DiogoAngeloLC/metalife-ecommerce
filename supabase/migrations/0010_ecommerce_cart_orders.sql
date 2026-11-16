-- ============================================================
-- 0010_ecommerce_cart_orders.sql
-- E-commerce: variantes, frete, pedidos e itens
-- ============================================================

-- ---------- Sequence legível ML-1001 ----------
CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq START WITH 1001;

-- ============================================================
-- TABELA: listing_variants
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_variants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sku              text,
  structure_color  text, -- STR
  upholstery_color text, -- STF
  price_cents      integer NOT NULL CHECK (price_cents >= 0),
  stock_qty        integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_variants_listing
  ON public.listing_variants(listing_id) WHERE active = true;

DROP TRIGGER IF EXISTS listing_variants_set_updated_at ON public.listing_variants;
CREATE TRIGGER listing_variants_set_updated_at
  BEFORE UPDATE ON public.listing_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.listing_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active variants of active listings" ON public.listing_variants;
CREATE POLICY "Public reads active variants of active listings"
  ON public.listing_variants FOR SELECT
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_variants.listing_id AND l.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Vendor manages variants of own listings" ON public.listing_variants;
CREATE POLICY "Vendor manages variants of own listings"
  ON public.listing_variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_variants.listing_id AND l.vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_variants.listing_id AND l.vendor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin full access listing_variants" ON public.listing_variants;
CREATE POLICY "Admin full access listing_variants"
  ON public.listing_variants FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- TABELA: shipping_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipping_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uf              text NOT NULL CHECK (char_length(uf) = 2 OR uf = 'ALL'),
  name            text NOT NULL,
  price_cents     integer NOT NULL CHECK (price_cents >= 0),
  estimated_days  integer CHECK (estimated_days IS NULL OR estimated_days >= 0),
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rules_uf_active
  ON public.shipping_rules(uf) WHERE active = true;

DROP TRIGGER IF EXISTS shipping_rules_set_updated_at ON public.shipping_rules;
CREATE TRIGGER shipping_rules_set_updated_at
  BEFORE UPDATE ON public.shipping_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active shipping rules" ON public.shipping_rules;
CREATE POLICY "Public reads active shipping rules"
  ON public.shipping_rules FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admin full access shipping_rules" ON public.shipping_rules;
CREATE POLICY "Admin full access shipping_rules"
  ON public.shipping_rules FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seed básico de frete (idempotente: só se tabela vazia)
INSERT INTO public.shipping_rules (uf, name, price_cents, estimated_days, active)
SELECT * FROM (VALUES
  ('SP'::text, 'Frete Transportadora Sudeste (SP)'::text, 25000, 7, true),
  ('RJ', 'Frete Transportadora Sudeste (RJ)', 28000, 8, true),
  ('MG', 'Frete Transportadora Sudeste (MG)', 28000, 8, true),
  ('ES', 'Frete Transportadora Sudeste (ES)', 30000, 9, true),
  ('PR', 'Frete Transportadora Sul (PR)', 32000, 10, true),
  ('SC', 'Frete Transportadora Sul (SC)', 32000, 10, true),
  ('RS', 'Frete Transportadora Sul (RS)', 35000, 12, true),
  ('ALL', 'Frete Transportadora Demais Regiões', 45000, 15, true),
  ('ALL', 'Retirada na Fábrica / Cotação Transportadora', 0, NULL::integer, true)
) AS v(uf, name, price_cents, estimated_days, active)
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_rules LIMIT 1);

-- ============================================================
-- TABELA: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number         text NOT NULL UNIQUE
                         DEFAULT ('ML-' || nextval('public.orders_order_number_seq')::text),
  buyer_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id            uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,

  buyer_name           text NOT NULL,
  buyer_email          text NOT NULL,
  buyer_phone          text NOT NULL,
  buyer_document       text NOT NULL,
  shipping_address     jsonb NOT NULL DEFAULT '{}'::jsonb,

  subtotal_cents       integer NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents       integer NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  discount_cents       integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents          integer NOT NULL CHECK (total_cents >= 0),

  status               text NOT NULL DEFAULT 'pending_payment'
                         CHECK (status IN (
                           'pending_payment','paid','preparing','shipped',
                           'delivered','canceled','refunded'
                         )),
  payment_method       text CHECK (payment_method IS NULL OR payment_method IN ('pix','credit_card','boleto')),
  payment_provider     text,
  external_payment_id  text UNIQUE,
  payment_payload      jsonb,
  tracking_code        text,

  -- LGPD
  opt_in               boolean NOT NULL,
  accepted_terms_at    timestamptz NOT NULL,
  ip_address           text,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON public.orders(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, created_at DESC);

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;
CREATE POLICY "Admin full access orders"
  ON public.orders FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Checkout: autenticado cria pedido próprio; guest (anon) com buyer_id nulo
DROP POLICY IF EXISTS "Anyone creates orders with consent" ON public.orders;
CREATE POLICY "Anyone creates orders with consent"
  ON public.orders FOR INSERT
  WITH CHECK (
    opt_in = true
    AND accepted_terms_at IS NOT NULL
    AND (buyer_id IS NULL OR buyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendor updates tracking on own orders" ON public.orders;
CREATE POLICY "Vendor updates tracking on own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- ============================================================
-- TABELA: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id        uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  variant_id        uuid REFERENCES public.listing_variants(id) ON DELETE SET NULL,
  title_snapshot    text NOT NULL,
  variant_snapshot  jsonb,
  unit_price_cents  integer NOT NULL CHECK (unit_price_cents >= 0),
  quantity          integer NOT NULL CHECK (quantity > 0),
  total_cents       integer NOT NULL CHECK (total_cents >= 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_listing ON public.order_items(listing_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read order_items via parent order" ON public.order_items;
CREATE POLICY "Read order_items via parent order"
  ON public.order_items FOR SELECT
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

DROP POLICY IF EXISTS "Insert order_items with parent order access" ON public.order_items;
CREATE POLICY "Insert order_items with parent order access"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.buyer_id IS NULL OR o.buyer_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Admin full access order_items" ON public.order_items;
CREATE POLICY "Admin full access order_items"
  ON public.order_items FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Confirmação pública de pedido (SECURITY DEFINER) — evita SELECT aberto em orders
CREATE OR REPLACE FUNCTION public.get_order_confirmation(p_order_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'order', to_jsonb(o),
    'items', COALESCE((
      SELECT jsonb_agg(to_jsonb(i))
      FROM public.order_items i
      WHERE i.order_id = o.id
    ), '[]'::jsonb)
  )
  INTO result
  FROM public.orders o
  WHERE o.order_number = p_order_number;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_confirmation(text) TO anon, authenticated, service_role;

-- Permite anexar dados de pagamento / status após criação (checkout + webhook mock)
DROP POLICY IF EXISTS "Update pending orders payment fields" ON public.orders;
CREATE POLICY "Update pending orders payment fields"
  ON public.orders FOR UPDATE
  USING (status = 'pending_payment')
  WITH CHECK (status IN ('pending_payment', 'paid', 'canceled'));
