import { createClient } from "@/lib/supabase/server";
import { MessagesLogContent } from "@/components/admin/messages-log-content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Logs de mensagens · Admin" };

export default async function MessagesLogPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; q?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("whatsapp_messages_log")
    .select(
      "*, leads(name, email), listings(title, slug), vendors(name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.type) query = query.eq("message_type", searchParams.type);
  if (searchParams.q) query = query.ilike("recipient_phone", `%${searchParams.q}%`);

  const { data: messages } = await query;

  return (
    <MessagesLogContent
      messages={messages ?? []}
      filters={searchParams}
      title="Logs de mensagens"
      subtitle="WhatsApp"
    />
  );
}
