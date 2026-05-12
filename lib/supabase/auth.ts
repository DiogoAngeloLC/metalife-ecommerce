import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { Database } from "./types";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentVendor(): Promise<Vendor | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", user.id)
    .single();

  return vendor;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireVendor() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/login");
  return vendor;
}
