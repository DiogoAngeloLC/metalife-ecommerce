import { requireAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getNotificationSettings } from "@/lib/notifications";
import { NotificationsManager } from "./notifications-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notificações · Admin" };

export default async function NotificacoesPage() {
  await requireAdmin();
  const supabase = createServiceClient();
  const settings = await getNotificationSettings();

  const { data: logs } = await supabase
    .from("webhook_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">
          Notificações
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Configure como você recebe alertas quando um novo lead é gerado.
        </p>
      </div>

      <NotificationsManager settings={settings} logs={logs ?? []} />
    </div>
  );
}
