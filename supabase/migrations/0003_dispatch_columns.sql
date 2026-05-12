-- 0003_dispatch_columns.sql
-- Colunas extras para dispatch WhatsApp (Prompt 8)

-- 1. Novas colunas em whatsapp_messages_log
ALTER TABLE whatsapp_messages_log
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payload jsonb,
  ADD COLUMN IF NOT EXISTS evolution_message_id text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

-- 2. Atualizar CHECK de message_type para incluir novos tipos
ALTER TABLE whatsapp_messages_log DROP CONSTRAINT whatsapp_messages_log_message_type_check;
ALTER TABLE whatsapp_messages_log ADD CONSTRAINT whatsapp_messages_log_message_type_check
  CHECK (message_type IN ('lead_contact','validation','marketing','lead_to_buyer','lead_to_seller','listing_approved','listing_rejected'));

-- 3. Atualizar CHECK de recipient_type para incluir seller
ALTER TABLE whatsapp_messages_log DROP CONSTRAINT whatsapp_messages_log_recipient_type_check;
ALTER TABLE whatsapp_messages_log ADD CONSTRAINT whatsapp_messages_log_recipient_type_check
  CHECK (recipient_type IN ('buyer','vendor','seller'));

-- 4. Índices úteis
CREATE INDEX IF NOT EXISTS idx_wml_listing ON whatsapp_messages_log(listing_id);
CREATE INDEX IF NOT EXISTS idx_wml_vendor ON whatsapp_messages_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_wml_evolution_msg ON whatsapp_messages_log(evolution_message_id);

-- 5. RLS: permitir service_role inserir/atualizar (Edge Functions usam service_role)
CREATE POLICY "Service role full access on whatsapp_messages_log"
  ON whatsapp_messages_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
