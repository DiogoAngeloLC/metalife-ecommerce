import { requireAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Server Actions do admin: exige admin autenticado e retorna client service_role
 * (bypass RLS). Usar em toda leitura/escrita privilegiada do painel.
 */
export async function adminServiceDb() {
  const user = await requireAdmin();
  const supabase = createServiceClient();
  return { user, supabase };
}
