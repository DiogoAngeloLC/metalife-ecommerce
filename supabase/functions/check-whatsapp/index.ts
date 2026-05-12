import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return new Response(
        JSON.stringify({ error: "phone é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Número inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache first
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
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (age < ONE_DAY) {
        return new Response(
          JSON.stringify({ valid: cached.is_valid, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Call Evolution API
    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE");

    if (!evolutionUrl || !evolutionKey || !evolutionInstance) {
      // If Evolution API not configured, assume valid
      return new Response(
        JSON.stringify({ valid: true, cached: false, reason: "validation_disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullNumber = `55${digits}`;
    const apiRes = await fetch(
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

    if (!apiRes.ok) {
      console.error("Evolution API error:", await apiRes.text());
      return new Response(
        JSON.stringify({ valid: true, cached: false, reason: "api_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiData = await apiRes.json();
    const result = Array.isArray(apiData) ? apiData[0] : apiData;
    const isValid = result?.exists === true;

    // Upsert cache
    await supabase
      .from("whatsapp_validation_cache")
      .upsert(
        {
          phone: digits,
          is_valid: isValid,
          checked_at: new Date().toISOString(),
          raw_response: result,
        },
        { onConflict: "phone" }
      );

    return new Response(
      JSON.stringify({ valid: isValid, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-whatsapp error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
