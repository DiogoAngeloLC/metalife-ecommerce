"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

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
