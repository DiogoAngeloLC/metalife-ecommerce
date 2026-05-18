import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok", { status: 200 });

  // Authenticate webhook caller via Evolution API key (header or query param)
  const expectedKey = Deno.env.get("EVOLUTION_API_KEY");
  if (expectedKey) {
    const authHeader =
      req.headers.get("apikey") ??
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const url = new URL(req.url);
    const queryKey = url.searchParams.get("apikey");

    if (authHeader !== expectedKey && queryKey !== expectedKey) {
      console.warn("Webhook authentication failed");
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const event = String(body.event ?? body.type ?? "").toLowerCase();

    // Apenas eventos de atualização de status interessam
    if (!event.includes("messages.update") && !event.includes("messages_update")) {
      return new Response("ignored", { status: 200 });
    }

    const data = body.data ?? body;
    const messageId =
      data.keyId ??
      data.key?.id ??
      data.messageId ??
      data.id ??
      null;
    const status = String(data.status ?? data.update?.status ?? "").toUpperCase();

    if (!messageId || !status) return new Response("no_data", { status: 200 });

    const update: Record<string, unknown> = {};
    if (status === "DELIVERY_ACK" || status === "DELIVERED") {
      update.status = "delivered";
      update.delivered_at = new Date().toISOString();
    } else if (status === "READ" || status === "PLAYED") {
      update.status = "read";
      update.read_at = new Date().toISOString();
    } else {
      return new Response("status_ignored", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase
      .from("whatsapp_messages_log")
      .update(update)
      .eq("evolution_message_id", messageId);

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("webhook error:", err);
    return new Response("err", { status: 200 }); // 200 pra Evolution não retentar indefinidamente
  }
});
