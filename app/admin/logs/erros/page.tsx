import { createClient } from "@/lib/supabase/server";
import { MessagesLogContent } from "@/components/admin/messages-log-content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Erros · Admin" };

export default async function ErrorsLogPage({
  searchParams,
}: {
  searchParams: { type?: string; q?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("whatsapp_messages_log")
    .select(
      "*, leads(name, email), listings(title, slug), vendors(name)"
    )
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(200);

  if (searchParams.type) query = query.eq("message_type", searchParams.type);
  if (searchParams.q) query = query.ilike("recipient_phone", `%${searchParams.q}%`);

  const { data: messages } = await query;

  return (
    <MessagesLogContent
      messages={messages ?? []}
      filters={{ status: "failed", ...searchParams }}
      title="Erros de envio"
      subtitle="WhatsApp"
      lockStatus
    />
  );
}
