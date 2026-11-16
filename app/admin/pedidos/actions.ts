"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/supabase/types";

export async function updateOrderTrackingAction(
  orderId: string,
  trackingCode: string,
  status?: OrderStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const supabase = createServiceClient();

  const patch: {
    tracking_code: string;
    status?: OrderStatus;
  } = {
    tracking_code: trackingCode.trim(),
  };

  if (status) patch.status = status;
  else if (trackingCode.trim()) patch.status = "shipped";

  const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/pedidos");
  return { ok: true };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/pedidos");
  return { ok: true };
}
