"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { dispatchMessage } from "@/lib/messages/dispatch";

export async function retryMessageAction(logId: string) {
  await requireAdmin();
  const supabase = createClient();

  const { data: original, error } = await supabase
    .from("whatsapp_messages_log")
    .select("*")
    .eq("id", logId)
    .single();

  if (error || !original) throw new Error("Log não encontrado.");

  const payload = (original.payload ?? {}) as { text?: string; image_url?: string };

  if (!payload.text) throw new Error("Payload sem texto — não dá pra reenviar.");

  await dispatchMessage({
    message_type: original.message_type as "lead_to_buyer" | "lead_to_seller" | "listing_approved" | "listing_rejected",
    recipient_phone: original.recipient_phone,
    recipient_type: original.recipient_type as "buyer" | "seller" | "vendor",
    text: payload.text,
    image_url: payload.image_url ?? undefined,
    related: {
      lead_id: original.lead_id ?? undefined,
      listing_id: original.listing_id ?? undefined,
      vendor_id: original.vendor_id ?? undefined,
    },
  });

  revalidatePath("/admin/logs/mensagens");
  revalidatePath("/admin/logs/erros");
}
