import { getConnectionState, getInstanceInfo } from "@/lib/evolution";
import { ConnectionContent } from "@/components/admin/connection-content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conexão · Admin" };

export default async function ConnectionPage() {
  const [{ state }, info] = await Promise.all([
    getConnectionState(),
    getInstanceInfo(),
  ]);
  return <ConnectionContent initialState={state} initialInfo={info} />;
}
