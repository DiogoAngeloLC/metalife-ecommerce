import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type MessageType =
  | "lead_to_buyer"
  | "lead_to_seller"
  | "listing_approved"
  | "listing_rejected";

interface DispatchPayload {
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

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let phone = digits;
  if (digits.length === 10 || digits.length === 11) phone = "55" + digits;
  if (phone.length < 12 || phone.length > 13) return null;
  return phone;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const payload = (await req.json()) as DispatchPayload;
    const normalized = normalizePhone(payload.recipient_phone);

    // 1. Insert queued log
    const { data: logRow, error: logErr } = await supabase
      .from("whatsapp_messages_log")
      .insert({
        recipient_phone: normalized ?? payload.recipient_phone,
        recipient_type: payload.recipient_type,
        message_type: payload.message_type,
        payload: { text: payload.text, image_url: payload.image_url ?? null },
        status: "queued",
        lead_id: payload.related.lead_id ?? null,
        listing_id: payload.related.listing_id ?? null,
        vendor_id: payload.related.vendor_id ?? null,
      })
      .select("id")
      .single();

    if (logErr || !logRow) {
      return new Response(JSON.stringify({ success: false, error: "log_insert_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!normalized) {
      await supabase
        .from("whatsapp_messages_log")
        .update({
          status: "failed",
          error_message: "Número em formato inválido",
          failed_at: new Date().toISOString(),
        })
        .eq("id", logRow.id);
      return new Response(JSON.stringify({ success: false, log_id: logRow.id, error: "invalid_phone" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Envia via Evolution
    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const instance = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (!evolutionUrl || !evolutionKey || !instance) {
      await supabase
        .from("whatsapp_messages_log")
        .update({
          status: "failed",
          error_message: "Evolution não configurada",
          failed_at: new Date().toISOString(),
        })
        .eq("id", logRow.id);
      return new Response(JSON.stringify({ success: false, log_id: logRow.id, error: "service_unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const endpoint = payload.image_url
      ? `${evolutionUrl}/message/sendMedia/${instance}`
      : `${evolutionUrl}/message/sendText/${instance}`;

    const body = payload.image_url
      ? {
          number: normalized,
          mediatype: "image",
          mimetype: "image/jpeg",
          media: payload.image_url,
          caption: payload.text,
          fileName: "anuncio.jpg",
        }
      : {
          number: normalized,
          text: payload.text,
        };

    try {
      const evolutionRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evolutionKey },
        body: JSON.stringify(body),
      });

      const evolutionText = await evolutionRes.text();
      let evolutionData: any = null;
      try {
        evolutionData = JSON.parse(evolutionText);
      } catch {
        // resposta não-JSON
      }

      if (!evolutionRes.ok) {
        await supabase
          .from("whatsapp_messages_log")
          .update({
            status: "failed",
            error_message: evolutionText.slice(0, 500),
            failed_at: new Date().toISOString(),
          })
          .eq("id", logRow.id);
        return new Response(
          JSON.stringify({ success: false, log_id: logRow.id, error: "evolution_error", details: evolutionText.slice(0, 200) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const messageId =
        evolutionData?.key?.id ??
        evolutionData?.messageId ??
        evolutionData?.id ??
        null;

      await supabase
        .from("whatsapp_messages_log")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          evolution_message_id: messageId,
        })
        .eq("id", logRow.id);

      return new Response(
        JSON.stringify({ success: true, log_id: logRow.id, message_id: messageId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchErr) {
      await supabase
        .from("whatsapp_messages_log")
        .update({
          status: "failed",
          error_message: fetchErr instanceof Error ? fetchErr.message : "fetch error",
          failed_at: new Date().toISOString(),
        })
        .eq("id", logRow.id);
      return new Response(
        JSON.stringify({ success: false, log_id: logRow.id, error: "network_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "internal" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
