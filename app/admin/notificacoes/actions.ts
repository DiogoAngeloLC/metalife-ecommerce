"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import {
  getNotificationSettings,
  generateSecret,
  testWebhook,
} from "@/lib/notifications";

export async function updateNotificationSettingsAction(
  settings: {
    webhook: { enabled: boolean; url: string | null; secret: string | null };
    whatsapp_admin: {
      enabled: boolean;
      phone: string | null;
      message_template: string | null;
    };
  }
) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key: "notifications", value: settings as unknown },
      { onConflict: "key" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/admin/notificacoes");
}

export async function generateSecretAction(): Promise<string> {
  await requireAdmin();
  return generateSecret();
}

export async function testWebhookAction(): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  await requireAdmin();
  const settings = await getNotificationSettings();

  if (!settings.webhook.url) {
    return { ok: false, error: "URL do webhook não configurada" };
  }

  return testWebhook(settings.webhook.url, settings.webhook.secret);
}
