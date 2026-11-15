import { createClient } from "@/lib/supabase/server";

type MessageType =
  | "lead_to_buyer"
  | "lead_to_seller"
  | "listing_approved"
  | "listing_rejected";

interface DispatchInput {
  message_type: MessageType;
  recipient_phone: string;
  recipient_type: "buyer" | "seller" | "vendor";
  text: string;
  image_url?: string;
  related: {
    lead_id?: string;
    listing_id?: string;
    vendor_id?: string;
  };
}

/**
 * Chama Edge Function dispatch-whatsapp. Fire-and-forget seguro:
 * erro de rede ou da Evolution NÃO propaga — fica logado em
 * whatsapp_messages_log com status='failed'.
 */
export async function dispatchMessage(input: DispatchInput): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.functions.invoke("dispatch-whatsapp", {
      body: input,
    });
    if (error) {
      console.error("dispatchMessage invoke error:", error);
    }
  } catch (err) {
    console.error("dispatchMessage exception:", err);
  }
}

export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL não configurada. Defina a URL absoluta do site (ex: https://seu-dominio.com.br)."
    );
  }
  return url.replace(/\/$/, "");
}

export function listingImagePublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/listing-images/${storagePath}`;
}
