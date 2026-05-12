"use server";

import { requireAdmin } from "@/lib/supabase/auth";
import { getConnectionState, getQRCode, logoutInstance } from "@/lib/evolution";

export async function fetchStatusAction() {
  await requireAdmin();
  return getConnectionState();
}

export async function fetchQRAction() {
  await requireAdmin();
  return getQRCode();
}

export async function disconnectAction() {
  await requireAdmin();
  return logoutInstance();
}
