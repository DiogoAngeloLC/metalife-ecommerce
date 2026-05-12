"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  dispatchMessage,
  siteUrl,
  listingImagePublicUrl,
} from "@/lib/messages/dispatch";
import {
  buildLeadToBuyer,
  buildLeadToSeller,
} from "@/lib/messages/templates";

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
): Promise<
  | { success: true; vendor?: { name: string; whatsapp: string } }
  | { success: false; error: string }
> {
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

    const { data: insertedLead, error: insertErr } = await supabase
      .from("leads")
      .insert({
        listing_id: parsed.listing_id,
        name: parsed.name,
        whatsapp: parsed.whatsapp,
        email: parsed.email,
        status: "pending",
        ip_address: ip,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (insertErr || !insertedLead) {
      return { success: false, error: `Erro ao registrar: ${insertErr?.message ?? "unknown"}` };
    }

    // Fetch full listing + vendor for dispatch and response
    let vendorResult: { name: string; whatsapp: string } | undefined;

    try {
      const { data: full } = await supabase
        .from("listings")
        .select(`
          id, title, slug, city, state, price, has_fixed_price, vendor_id,
          listing_images(storage_path, position),
          vendors(name, whatsapp)
        `)
        .eq("id", parsed.listing_id)
        .single();

      if (full?.vendors) {
        const url = siteUrl();
        const images = (full.listing_images ?? []) as { storage_path: string; position: number }[];
        const firstImage = images.sort((a, b) => a.position - b.position)[0];
        const imageUrl = firstImage
          ? listingImagePublicUrl(firstImage.storage_path)
          : undefined;
        const vendor = full.vendors as { name: string | null; whatsapp: string | null };

        if (vendor.name && vendor.whatsapp) {
          vendorResult = { name: vendor.name, whatsapp: vendor.whatsapp };
        }

        // Mensagem para o comprador
        void dispatchMessage({
          message_type: "lead_to_buyer",
          recipient_phone: parsed.whatsapp,
          recipient_type: "buyer",
          text: buildLeadToBuyer({
            buyer_name: parsed.name,
            listing: full,
            vendor,
            site_url: url,
          }),
          image_url: imageUrl,
          related: {
            lead_id: insertedLead.id,
            listing_id: full.id,
            vendor_id: full.vendor_id,
          },
        });

        // Mensagem para o vendedor (só se tem WhatsApp)
        if (vendor.whatsapp) {
          void dispatchMessage({
            message_type: "lead_to_seller",
            recipient_phone: vendor.whatsapp,
            recipient_type: "seller",
            text: buildLeadToSeller({
              vendor_name: vendor.name ?? "Vendedor",
              buyer: {
                name: parsed.name,
                whatsapp: parsed.whatsapp,
                email: parsed.email,
              },
              listing: full,
              site_url: url,
            }),
            related: {
              lead_id: insertedLead.id,
              listing_id: full.id,
              vendor_id: full.vendor_id,
            },
          });
        }
      }
    } catch (err) {
      console.error("Lead dispatch error:", err);
    }

    return { success: true, vendor: vendorResult };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0]?.message ?? "Dados inválidos" };
    }
    return { success: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}
