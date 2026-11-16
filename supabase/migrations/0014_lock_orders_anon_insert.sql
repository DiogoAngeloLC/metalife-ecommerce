-- ============================================================
-- 0014_lock_orders_anon_insert.sql
-- Impede INSERT público em orders/order_items (somente service_role)
-- ============================================================

-- Remove policies de INSERT acessíveis a anon/PUBLIC
DROP POLICY IF EXISTS "Anyone creates orders with consent" ON public.orders;
DROP POLICY IF EXISTS "Insert order_items with parent order access" ON public.order_items;

-- Revoga privilégios de INSERT no cliente (anon + authenticated)
REVOKE INSERT ON TABLE public.orders FROM anon;
REVOKE INSERT ON TABLE public.order_items FROM anon;
REVOKE INSERT ON TABLE public.orders FROM authenticated;
REVOKE INSERT ON TABLE public.order_items FROM authenticated;

-- Mantém leitura/atualização legítima para usuários autenticados (policies existentes)
GRANT SELECT, UPDATE ON TABLE public.orders TO authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;

-- attach_order_payment só via service_role (Server Action / webhook)
REVOKE ALL ON FUNCTION public.attach_order_payment(uuid, text, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.attach_order_payment(uuid, text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.attach_order_payment(uuid, text, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.attach_order_payment(uuid, text, text, text, jsonb) TO service_role;

COMMENT ON TABLE public.orders IS
  'Pedidos: INSERT apenas via Server Action com SUPABASE_SERVICE_ROLE_KEY (sem INSERT para anon).';
