"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { dispatchMessage, siteUrl } from "@/lib/messages/dispatch";
import { buildListingApproved, buildListingRejected } from "@/lib/messages/templates";

export async function approveListingAction(listingId: string) {
  await requireAdmin();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("listings")
    .update({
      status: "active",
      published_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: user!.id,
      rejection_reason: null,
    })
    .eq("id", listingId);

  if (error) throw new Error(error.message);

  // Dispatch WhatsApp de aprovação (fire-and-forget)
  try {
    const { data: full } = await supabase
      .from("listings")
      .select("id, title, slug, vendor_id, vendors(name, whatsapp)")
      .eq("id", listingId)
      .single();

    const vendor = full?.vendors as { name: string | null; whatsapp: string | null } | null;
    if (vendor?.whatsapp) {
      void dispatchMessage({
        message_type: "listing_approved",
        recipient_phone: vendor.whatsapp,
        recipient_type: "vendor",
        text: buildListingApproved({
          vendor_name: vendor.name ?? "",
          listing: full!,
          site_url: siteUrl(),
        }),
        related: { listing_id: full!.id, vendor_id: full!.vendor_id },
      });
    }
  } catch (err) {
    console.error("Approve dispatch error:", err);
  }

  revalidatePath("/admin/anuncios");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function rejectListingAction(listingId: string, reason: string) {
  await requireAdmin();
  if (!reason.trim()) throw new Error("Motivo é obrigatório.");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("listings")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user!.id,
      rejection_reason: reason.trim(),
    })
    .eq("id", listingId);

  if (error) throw new Error(error.message);

  // Dispatch WhatsApp de rejeição (fire-and-forget)
  try {
    const { data: full } = await supabase
      .from("listings")
      .select("id, title, vendor_id, vendors(name, whatsapp)")
      .eq("id", listingId)
      .single();

    const vendor = full?.vendors as { name: string | null; whatsapp: string | null } | null;
    if (vendor?.whatsapp) {
      void dispatchMessage({
        message_type: "listing_rejected",
        recipient_phone: vendor.whatsapp,
        recipient_type: "vendor",
        text: buildListingRejected({
          vendor_name: vendor.name ?? "",
          listing: full!,
          reason: reason.trim(),
          site_url: siteUrl(),
        }),
        related: { listing_id: full!.id, vendor_id: full!.vendor_id },
      });
    }
  } catch (err) {
    console.error("Reject dispatch error:", err);
  }

  revalidatePath("/admin/anuncios");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function unpublishListingAction(listingId: string) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("listings")
    .update({ status: "paused" })
    .eq("id", listingId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/anuncios");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteListingAction(listingId: string) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/anuncios");
  revalidatePath("/admin");
  revalidatePath("/");
}
