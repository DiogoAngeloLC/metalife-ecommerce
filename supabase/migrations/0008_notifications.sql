-- 1. Seed da config de notificações
INSERT INTO public.site_settings (key, value) VALUES
  ('notifications', '{
    "webhook": {
      "enabled": false,
      "url": null,
      "secret": null
    },
    "whatsapp_admin": {
      "enabled": false,
      "phone": null,
      "message_template": "🔔 *Novo Lead — Classificado Pilates*\n\n*{{lead_name}}* demonstrou interesse em:\n_{{listing_title}}_\n\n📍 {{listing_city}}, {{listing_state}}\n💰 {{listing_price}}\n\n📱 https://wa.me/{{lead_whatsapp}}\n✉️ {{lead_email}}\n\nVer no painel: {{admin_url}}"
    }
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Log de webhooks disparados
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  event_type text NOT NULL DEFAULT 'lead.created',
  payload jsonb NOT NULL,
  status_code int,
  response_body text,
  error_message text,
  duration_ms int,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON public.webhook_logs(created_at DESC);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_logs_admin_read" ON public.webhook_logs;
CREATE POLICY "webhook_logs_admin_read" ON public.webhook_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Cleanup: manter apenas últimas 100 entries
CREATE OR REPLACE FUNCTION public.trim_webhook_logs()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.webhook_logs
  WHERE id NOT IN (
    SELECT id FROM public.webhook_logs
    ORDER BY created_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_trim_webhook_logs ON public.webhook_logs;
CREATE TRIGGER trg_trim_webhook_logs
  AFTER INSERT ON public.webhook_logs
  FOR EACH STATEMENT EXECUTE FUNCTION public.trim_webhook_logs();
