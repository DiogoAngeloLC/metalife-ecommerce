-- 0002_curation_admin_logs.sql
-- Curadoria, admin e logs de WhatsApp

-- 1. Atualizar CHECK constraint de status em listings para incluir pending_review e rejected
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check
  CHECK (status = ANY (ARRAY['draft','active','paused','sold','pending_review','rejected']));

-- 2. Campos extras em listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- 3. Tabela app_admins
CREATE TABLE IF NOT EXISTS app_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','super_admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin list" ON app_admins;
CREATE POLICY "Admins can read admin list"
  ON app_admins FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM app_admins));

-- 4. Log de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('buyer','vendor')),
  recipient_phone text NOT NULL,
  message_type text NOT NULL DEFAULT 'lead_contact' CHECK (message_type IN ('lead_contact','validation','marketing')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','read','failed')),
  external_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE whatsapp_messages_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read whatsapp logs" ON whatsapp_messages_log;
CREATE POLICY "Admins can read whatsapp logs"
  ON whatsapp_messages_log FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM app_admins));

CREATE INDEX IF NOT EXISTS idx_wml_lead ON whatsapp_messages_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_wml_status ON whatsapp_messages_log(status);

-- 5. Cache de validação WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_validation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  is_valid boolean NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  raw_response jsonb
);

ALTER TABLE whatsapp_validation_cache ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wvc_phone ON whatsapp_validation_cache(phone);

-- 6. Campo error_message em leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS error_message text;
