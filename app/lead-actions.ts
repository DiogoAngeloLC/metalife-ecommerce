"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  listing_id: z.string().uuid(),
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(10, "WhatsApp inválido").max(13)),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
});

export type SubmitLeadInput = z.input<typeof Schema>;

export async function submitLeadAction(
  input: SubmitLeadInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const parsed = Schema.parse(input);

    const supabase = createClient();
    const h = headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = h.get("user-agent") ?? null;

    // Confirma que listing existe e está ativo
    const { data: listing, error: lookupErr } = await supabase
      .from("listings")
      .select("id, status")
      .eq("id", parsed.listing_id)
      .single();

    if (lookupErr || !listing) {
      return { success: false, error: "Anúncio não encontrado." };
    }
    if (listing.status !== "active") {
      return { success: false, error: "Este anúncio não está mais disponível." };
    }

    // Rate limit: 3 leads do mesmo IP por hora
    if (ip) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gt("created_at", oneHourAgo);

      if ((count ?? 0) >= 3) {
        return {
          success: false,
          error: "Você fez muitas solicitações. Tente novamente em uma hora.",
        };
      }
    }

    const { error: insertErr } = await supabase.from("leads").insert({
      listing_id: parsed.listing_id,
      name: parsed.name,
      whatsapp: parsed.whatsapp,
      email: parsed.email,
      status: "pending",
      ip_address: ip,
      user_agent: userAgent,
    });

    if (insertErr) {
      return { success: false, error: `Erro ao registrar: ${insertErr.message}` };
    }

    // TODO Prompt 7: disparar Evolution aqui

    return { success: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0]?.message ?? "Dados inválidos" };
    }
    return { success: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}
