"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function makeAdminAction(userId: string) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("app_admins")
    .insert({ user_id: userId });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}

export async function removeAdminAction(userId: string) {
  await requireAdmin();
  const supabase = createClient();
  const {
    data: { user: current },
  } = await supabase.auth.getUser();

  if (userId === current!.id) {
    throw new Error("Você não pode remover seu próprio acesso de admin.");
  }

  const { error } = await supabase
    .from("app_admins")
    .delete()
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}
