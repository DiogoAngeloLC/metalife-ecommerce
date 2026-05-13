"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient, createAnonClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { siteUrl } from "@/lib/messages/dispatch";

export async function makeAdminAction(userId: string) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase.from("app_admins").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id", ignoreDuplicates: false }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}

export async function removeAdminAction(userId: string) {
  const current = await requireAdmin();
  const supabase = createServiceClient();

  if (userId === current.id) {
    throw new Error("Você não pode remover seu próprio acesso de administrador.");
  }

  const { error } = await supabase.from("app_admins").delete().eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}

export async function toggleVerifiedAction(vendorId: string, verified: boolean) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase.from("vendors").update({ is_verified: verified }).eq("id", vendorId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}

const INVITE_REDIRECT = () =>
  `${siteUrl()}/auth/callback?next=${encodeURIComponent("/perfil")}`;

/** Metadata interna — trigger em auth.users promove a app_admins (ver migração 0008). */
const INVITED_ADMIN_META = { invited_as_admin: true } as const;

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

  const { error } = await supabase.auth.admin.inviteUserByEmail(parsed.data, {
    redirectTo: INVITE_REDIRECT(),
    data: { ...INVITED_ADMIN_META },
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
          "Este e-mail já está cadastrado. Encontre a pessoa na lista abaixo e toque em \"Dar acesso de administrador\".",
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function resendPendingAccessEmailAction(
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: authData, error: getErr } = await supabase.auth.admin.getUserById(userId);
  if (getErr || !authData?.user?.email) {
    return { ok: false, message: "Não foi possível localizar o e-mail desta conta." };
  }

  const user = authData.user;
  const email = user.email;
  if (!email) {
    return { ok: false, message: "Não foi possível localizar o e-mail desta conta." };
  }

  if (user.email_confirmed_at) {
    return {
      ok: false,
      message: "Este e-mail já foi confirmado. Use \"Enviar redefinição de senha\" se a pessoa não lembra a senha.",
    };
  }

  if (user.invited_at) {
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: INVITE_REDIRECT(),
      data: { ...INVITED_ADMIN_META },
    });
    if (error) {
      return {
        ok: false,
        message:
          "Não foi possível reenviar o convite. Tente de novo em instantes ou confira as definições de e-mail do sistema.",
      };
    }
    revalidatePath("/admin/usuarios");
    return { ok: true };
  }

  const anon = createAnonClient();
  const { error: resendErr } = await anon.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: INVITE_REDIRECT() },
  });

  if (resendErr) {
    return {
      ok: false,
      message:
        "Não foi possível reenviar o e-mail de confirmação. Tente de novo em instantes ou confira as definições de e-mail do sistema.",
    };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function sendPasswordResetEmailAction(
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: authData, error: getErr } = await supabase.auth.admin.getUserById(userId);
  if (getErr || !authData?.user?.email) {
    return { ok: false, message: "Não foi possível localizar o e-mail desta conta." };
  }

  const resetEmail = authData.user.email;
  if (!resetEmail) {
    return { ok: false, message: "Não foi possível localizar o e-mail desta conta." };
  }

  if (!authData.user.email_confirmed_at) {
    return {
      ok: false,
      message: "Esta conta ainda não confirmou o e-mail. Use \"Reenviar e-mail de acesso\" primeiro.",
    };
  }

  const anon = createAnonClient();
  const { error } = await anon.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: INVITE_REDIRECT(),
  });

  if (error) {
    return {
      ok: false,
      message:
        "Não foi possível enviar o e-mail de redefinição de senha. Tente de novo em instantes ou confira as definições de e-mail do sistema.",
    };
  }

  return { ok: true };
}

export async function deleteUserAccountAction(
  userId: string,
  currentAdminId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin();
  if (userId === currentAdminId) {
    return { ok: false, message: "Você não pode apagar a sua própria conta." };
  }

  const supabase = createServiceClient();

  const { count, error: countErr } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", userId);

  if (countErr) {
    return { ok: false, message: "Não foi possível verificar os anúncios deste usuário." };
  }
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message:
        "Não é possível apagar esta conta: há anúncios associados (histórico). Remova os anúncios na curadoria ou entre em contato com o suporte técnico.",
    };
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  return { ok: true };
}
