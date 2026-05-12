"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Power, RefreshCw, Wifi, WifiOff, Smartphone, AlertCircle } from "lucide-react";
import {
  fetchStatusAction,
  fetchQRAction,
  disconnectAction,
} from "@/app/admin/conexao/actions";

type State = "open" | "connecting" | "close" | "unknown";

export function ConnectionContent({
  initialState,
  initialInfo,
}: {
  initialState: State;
  initialInfo: {
    state: string | null;
    phoneNumber: string | null;
    profileName: string | null;
    profilePicUrl: string | null;
  };
}) {
  const [state, setState] = useState<State>(initialState);
  const [info, setInfo] = useState(initialInfo);
  const [qrcode, setQRCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const qrFetchedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchStatusAction();
        setState(result.state as State);
        if (result.state === "open") {
          setQRCode(null);
          setPairingCode(null);
          qrFetchedRef.current = false;
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ((state === "close" || state === "connecting") && !qrFetchedRef.current) {
      qrFetchedRef.current = true;
      fetchQR();
    }
  }, [state]);

  const fetchQR = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await fetchQRAction();
      setQRCode(result.qrcode);
      setPairingCode(result.pairingCode);
      if (result.error) setErrorMsg(result.error);
    });
  };

  const disconnect = () => {
    if (!confirm("Desconectar a instância? Mensagens não serão enviadas até reconectar.")) return;
    startTransition(async () => {
      await disconnectAction();
      setState("close");
      setInfo({ state: null, phoneNumber: null, profileName: null, profilePicUrl: null });
      qrFetchedRef.current = false;
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mb-6">
        <div className="text-label-bold text-[var(--text-muted)] mb-2">WHATSAPP EVOLUTION</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[var(--ink)]">Conexão</h1>
      </div>

      {/* Status */}
      <div className="bg-white border border-[var(--line)] p-8 mb-6">
        <div className="flex items-center gap-5">
          <div
            className={`w-16 h-16 flex items-center justify-center ${
              state === "open"
                ? "bg-[var(--success-bg)]"
                : state === "connecting"
                ? "bg-amber-50"
                : "bg-red-50"
            }`}
          >
            {state === "open" ? (
              <Wifi className="w-7 h-7 text-[var(--success)]" />
            ) : state === "connecting" ? (
              <RefreshCw className="w-7 h-7 text-amber-600 animate-spin" />
            ) : (
              <WifiOff className="w-7 h-7 text-[var(--danger)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-label-bold text-[var(--text-muted)] mb-1">
              STATUS DA INSTÂNCIA
            </div>
            <div className="font-display text-2xl font-bold uppercase">
              {state === "open"
                ? "Conectado"
                : state === "connecting"
                ? "Conectando…"
                : state === "close"
                ? "Desconectado"
                : "Desconhecido"}
            </div>
            {state === "open" && info.phoneNumber && (
              <div className="text-sm text-[var(--ink-soft)] mt-1 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                {info.profileName ? `${info.profileName} · ` : ""}
                +{info.phoneNumber}
              </div>
            )}
          </div>
          {state === "open" && (
            <button
              onClick={disconnect}
              disabled={isPending}
              className="text-label-bold px-4 py-2 bg-red-50 text-[var(--danger)] border border-[var(--danger)] hover:bg-red-100 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Power className="w-4 h-4" />
              Desconectar
            </button>
          )}
        </div>
      </div>

      {/* QR Code */}
      {state !== "open" && (
        <div className="bg-white border border-[var(--line)] p-8 text-center">
          <h2 className="font-display text-2xl font-bold uppercase mb-2">Escanear QR Code</h2>
          <p className="text-sm text-[var(--ink-soft)] mb-6 max-w-md mx-auto">
            No WhatsApp do celular dedicado: <strong>Mais opções</strong> →{" "}
            <strong>Aparelhos conectados</strong> → <strong>Conectar um aparelho</strong>.
          </p>

          <div className="inline-block bg-white p-6 border border-[var(--line)]">
            {qrcode ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrcode} alt="QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-[var(--text-muted)] animate-spin" />
              </div>
            )}
          </div>

          {pairingCode && (
            <div className="mt-5 text-sm">
              <span className="text-[var(--text-muted)]">Ou use o código:</span>{" "}
              <strong className="font-display text-xl tracking-widest text-[var(--action)]">
                {pairingCode}
              </strong>
            </div>
          )}

          <button
            onClick={fetchQR}
            disabled={isPending}
            className="mt-6 text-label-bold px-4 py-2 bg-[var(--ink)] text-white hover:opacity-90 transition flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isPending ? "animate-spin" : ""}`} />
            Gerar novo QR
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-4 bg-red-50 border border-[var(--danger)] text-sm text-[var(--danger)] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
