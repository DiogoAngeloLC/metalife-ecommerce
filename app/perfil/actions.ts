"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UpdateVendorSchema, type UpdateVendorInput } from "@/lib/validations";

export async function updateVendorAction(input: UpdateVendorInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const parsed = UpdateVendorSchema.parse(input);

  const { error } = await supabase
    .from("vendors")
    .update({
      name: parsed.name,
      whatsapp: parsed.whatsapp,
      city: parsed.city,
      state: parsed.state,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/perfil");
  redirect("/dashboard");
}
