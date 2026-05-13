"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { siteUrl } from "@/lib/messages/dispatch";

export async function makeAdminAction(userId: string) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("app_admins")
    .insert({ user_id: userId });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}

export async function removeAdminAction(userId: string) {
  const current = await requireAdmin();
  const supabase = createServiceClient();

  if (userId === current.id) {
    throw new Error("Você não pode remover seu próprio acesso de admin.");
  }

  const { error } = await supabase
    .from("app_admins")
    .delete()
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}

export async function toggleVerifiedAction(vendorId: string, verified: boolean) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("vendors")
    .update({ is_verified: verified })
    .eq("id", vendorId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}

export async function inviteAdminByEmailAction(
  email: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin();
  const trimmed = email.trim().toLowerCase();
  const parsed = z.string().email().safeParse(trimmed);
  if (!parsed.success) {
    return { ok: false, message: "Informe um e-mail válido." };
  }

  const supabase = createServiceClient();
  const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent("/perfil")}`;

  const { error } = await supabase.auth.admin.inviteUserByEmail(parsed.data, {
    redirectTo,
  });

  if (error) {
    const raw = error.message.toLowerCase();
    if (
      raw.includes("already") ||
      raw.includes("registered") ||
      raw.includes("exists") ||
      raw.includes("duplicate")
    ) {
      return {
        ok: false,
        message:
          "Este e-mail já possui conta. Localize o usuário na lista abaixo e use «Tornar admin».",
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
