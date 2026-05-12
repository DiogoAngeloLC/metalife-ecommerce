import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return json({ valid: false, reason: "phone_required" }, 400);
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      return json({ valid: false, reason: "invalid_format" });
    }

    // Check cache (TTL 48h)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: cached } = await supabase
      .from("whatsapp_validation_cache")
      .select("is_valid, checked_at")
      .eq("phone", digits)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.checked_at).getTime();
      const TTL = 48 * 60 * 60 * 1000;
      if (age < TTL) {
        return json({
          valid: cached.is_valid,
          cached: true,
          ...(!cached.is_valid && { reason: "not_on_whatsapp" }),
        });
      }
    }

    // Fail-closed: if secrets are missing, block
    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (!evolutionUrl || !evolutionKey || !evolutionInstance) {
      console.error("Evolution secrets not configured");
      return json({ valid: false, reason: "service_unavailable" });
    }

    // Call Evolution API
    const fullNumber = `55${digits}`;
    let apiRes: Response;
    try {
      apiRes = await fetch(
        `${evolutionUrl}/chat/whatsappNumbers/${evolutionInstance}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionKey,
          },
          body: JSON.stringify({ numbers: [fullNumber] }),
        }
      );
    } catch (fetchErr) {
      console.error("Evolution fetch error:", fetchErr);
      return json({ valid: false, reason: "service_unavailable" });
    }

    if (!apiRes.ok) {
      console.error("Evolution API HTTP error:", apiRes.status, await apiRes.text());
      return json({ valid: false, reason: "service_unavailable" });
    }

    const apiData = await apiRes.json();

    // Detect empty response (instance disconnected)
    const results = Array.isArray(apiData) ? apiData : [];
    const entry = results[0];

    if (!entry || typeof entry.exists !== "boolean") {
      console.error("Evolution returned inconclusive response:", JSON.stringify(apiData));
      return json({ valid: false, reason: "service_unavailable" });
    }

    const isValid = entry.exists === true;

    // Cache only conclusive results
    await supabase
      .from("whatsapp_validation_cache")
      .upsert(
        {
          phone: digits,
          is_valid: isValid,
          checked_at: new Date().toISOString(),
          raw_response: entry,
        },
        { onConflict: "phone" }
      );

    if (isValid) {
      return json({ valid: true, cached: false });
    }
    return json({ valid: false, reason: "not_on_whatsapp", cached: false });
  } catch (err) {
    console.error("check-whatsapp error:", err);
    return json({ valid: false, reason: "internal_error" }, 500);
  }
});
