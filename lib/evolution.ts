"use server";

function evolutionConfigured(): boolean {
  const url = process.env.EVOLUTION_API_URL?.trim();
  const key = process.env.EVOLUTION_API_KEY?.trim();
  return Boolean(
    url &&
      key &&
      !url.includes("your-domain") &&
      key !== "your-evolution-api-key-here"
  );
}

const URL_API = process.env.EVOLUTION_API_URL?.trim() ?? "";
const KEY = process.env.EVOLUTION_API_KEY?.trim() ?? "";
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME?.trim() || "metalife";

async function evo(path: string, init: RequestInit = {}) {
  if (!evolutionConfigured()) {
    throw new Error("Evolution API não configurada");
  }
  return fetch(`${URL_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: KEY,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

export type ConnectionState = "open" | "connecting" | "close" | "unknown";

export async function getConnectionState(): Promise<{ state: ConnectionState }> {
  if (!evolutionConfigured()) return { state: "close" };
  try {
    const res = await evo(`/instance/connectionState/${INSTANCE}`);
    if (!res.ok) return { state: "unknown" };
    const data = await res.json();
    const state = data.instance?.state ?? data.state ?? "unknown";
    return { state: state as ConnectionState };
  } catch {
    return { state: "unknown" };
  }
}

export async function getInstanceInfo(): Promise<{
  state: string | null;
  phoneNumber: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
}> {
  if (!evolutionConfigured()) {
    return { state: null, phoneNumber: null, profileName: null, profilePicUrl: null };
  }
  try {
    const res = await evo(`/instance/fetchInstances?instanceName=${INSTANCE}`);
    if (!res.ok) return { state: null, phoneNumber: null, profileName: null, profilePicUrl: null };
    const data = await res.json();
    const inst = Array.isArray(data) ? data[0] : data;
    const node = inst?.instance ?? inst;
    const owner = node?.ownerJid ?? node?.owner ?? "";
    const phoneNumber = typeof owner === "string" ? owner.split("@")[0] : null;
    return {
      state: node?.connectionStatus ?? node?.state ?? null,
      phoneNumber,
      profileName: node?.profileName ?? null,
      profilePicUrl: node?.profilePicUrl ?? null,
    };
  } catch {
    return { state: null, phoneNumber: null, profileName: null, profilePicUrl: null };
  }
}

export async function getQRCode(): Promise<{
  qrcode: string | null;
  pairingCode: string | null;
  error?: string;
}> {
  if (!evolutionConfigured()) {
    return {
      qrcode: null,
      pairingCode: null,
      error: "Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY.",
    };
  }
  try {
    const res = await evo(`/instance/connect/${INSTANCE}`);
    if (!res.ok) {
      const t = await res.text();
      return { qrcode: null, pairingCode: null, error: t.slice(0, 200) };
    }
    const data = await res.json();
    const qrcode =
      data.base64 ??
      data.qrcode?.base64 ??
      data.qrcode ??
      null;
    const pairingCode = data.pairingCode ?? data.code ?? null;
    const normalized = qrcode && !qrcode.startsWith("data:")
      ? `data:image/png;base64,${qrcode}`
      : qrcode;
    return { qrcode: normalized, pairingCode };
  } catch (err) {
    return { qrcode: null, pairingCode: null, error: err instanceof Error ? err.message : "erro" };
  }
}

export async function logoutInstance(): Promise<boolean> {
  if (!evolutionConfigured()) return false;
  try {
    const res = await evo(`/instance/logout/${INSTANCE}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}
