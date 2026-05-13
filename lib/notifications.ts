"use server";

import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { dispatchMessage, siteUrl } from "@/lib/messages/dispatch";

/* ── Types ──────────────────────────────────────────────────────── */

interface WebhookConfig {
  enabled: boolean;
  url: string | null;
  secret: string | null;
}

interface WhatsAppAdminConfig {
  enabled: boolean;
  phone: string | null;
  message_template: string | null;
}

export interface NotificationSettings {
  webhook: WebhookConfig;
  whatsapp_admin: WhatsAppAdminConfig;
}

export interface LeadNotificationContext {
  lead_id: string;
  lead_name: string;
  lead_whatsapp: string;
  lead_email: string;
  listing_id: string;
  listing_title: string;
  listing_city: string;
  listing_state: string;
  listing_price: string;
  admin_url: string;
}

/* ── Settings ───────────────────────────────────────────────────── */

const DEFAULT_SETTINGS: NotificationSettings = {
  webhook: { enabled: false, url: null, secret: null },
  whatsapp_admin: { enabled: false, phone: null, message_template: null },
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "notifications")
    .single();

  if (!data?.value) return DEFAULT_SETTINGS;
  return data.value as NotificationSettings;
}

/* ── Crypto helpers ─────────────────────────────────────────────── */

export function generateSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/* ── Template rendering ─────────────────────────────────────────── */

function renderTemplate(
  template: string,
  ctx: LeadNotificationContext
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => (ctx as unknown as Record<string, string>)[key] ?? ""
  );
}

/* ── Webhook payload ────────────────────────────────────────────── */

function buildWebhookPayload(ctx: LeadNotificationContext) {
  return {
    event: "lead.created",
    timestamp: new Date().toISOString(),
    data: {
      lead: {
        id: ctx.lead_id,
        name: ctx.lead_name,
        whatsapp: ctx.lead_whatsapp,
        email: ctx.lead_email,
      },
      listing: {
        id: ctx.listing_id,
        title: ctx.listing_title,
        city: ctx.listing_city,
        state: ctx.listing_state,
        price: ctx.listing_price,
      },
      admin_url: ctx.admin_url,
    },
  };
}

/* ── Internal: send webhook with logging ────────────────────────── */

async function sendWebhook(
  url: string,
  secret: string | null,
  ctx: LeadNotificationContext
): Promise<void> {
  const supabase = createServiceClient();
  const payload = buildWebhookPayload(ctx);
  const body = JSON.stringify(payload);
  const start = Date.now();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["X-Classificado-Signature"] = `sha256=${signPayload(body, secret)}`;
  }

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);

    statusCode = res.status;
    responseBody = await res.text().catch(() => null);
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Unknown webhook error";
  }

  const durationMs = Date.now() - start;

  // Log to webhook_logs (fire-and-forget)
  await supabase
    .from("webhook_logs")
    .insert({
      url,
      event_type: "lead.created",
      payload: payload as unknown,
      status_code: statusCode,
      response_body: responseBody,
      error_message: errorMessage,
      duration_ms: durationMs,
      lead_id: ctx.lead_id,
    })
    .then(({ error }) => {
      if (error) console.error("webhook_logs insert error:", error);
    });
}

/* ── Main dispatcher ────────────────────────────────────────────── */

export async function dispatchLeadNotifications(
  ctx: LeadNotificationContext
): Promise<void> {
  try {
    const settings = await getNotificationSettings();

    // Webhook HTTP POST
    if (settings.webhook.enabled && settings.webhook.url) {
      void sendWebhook(
        settings.webhook.url,
        settings.webhook.secret,
        ctx
      );
    }

    // WhatsApp admin notification
    if (settings.whatsapp_admin.enabled && settings.whatsapp_admin.phone) {
      const template =
        settings.whatsapp_admin.message_template ??
        defaultWhatsAppTemplate();
      const text = renderTemplate(template, ctx);

      void dispatchMessage({
        message_type: "lead_to_seller" as const,
        recipient_phone: settings.whatsapp_admin.phone,
        recipient_type: "vendor",
        text,
        related: {
          lead_id: ctx.lead_id,
          listing_id: ctx.listing_id,
        },
      });
    }
  } catch (err) {
    console.error("dispatchLeadNotifications error:", err);
  }
}

/* ── Test helpers (called from admin actions) ───────────────────── */

export async function testWebhook(
  url: string,
  secret: string | null
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const ctx = sampleContext();
  const payload = buildWebhookPayload(ctx);
  const body = JSON.stringify(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["X-Classificado-Signature"] = `sha256=${signPayload(body, secret)}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);

    return { ok: res.ok, status: res.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}

function sampleContext(): LeadNotificationContext {
  return {
    lead_id: "00000000-0000-0000-0000-000000000000",
    lead_name: "Teste Lead",
    lead_whatsapp: "5511999999999",
    lead_email: "teste@exemplo.com",
    listing_id: "00000000-0000-0000-0000-000000000001",
    listing_title: "Reformer Pilates Profissional",
    listing_city: "São Paulo",
    listing_state: "SP",
    listing_price: "R$ 8.500,00",
    admin_url: `${siteUrl()}/admin/leads`,
  };
}

function defaultWhatsAppTemplate(): string {
  return `🔔 *Novo Lead — Classificado Pilates*

*{{lead_name}}* demonstrou interesse em:
_{{listing_title}}_

📍 {{listing_city}}, {{listing_state}}
💰 {{listing_price}}

📱 https://wa.me/{{lead_whatsapp}}
✉️ {{lead_email}}

Ver no painel: {{admin_url}}`;
}
