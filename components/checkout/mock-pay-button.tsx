"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MockPayButton({
  orderNumber,
  externalPaymentId,
}: {
  orderNumber: string;
  externalPaymentId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!externalPaymentId) return null;

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        process.env.NEXT_PUBLIC_ASAAS_WEBHOOK_TOKEN ||
        "dev-webhook-token";
      const res = await fetch("/api/webhooks/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "asaas-access-token": token,
        },
        body: JSON.stringify({
          event: "PAYMENT_RECEIVED",
          payment: { id: externalPaymentId, status: "RECEIVED" },
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Falha no webhook mock");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao simular pagamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border border-dashed border-[var(--warning)] bg-[var(--warning-bg)] p-4 space-y-2">
      <p className="text-xs text-[var(--ink-soft)]">
        Modo mock — simule a confirmação do pagamento do pedido{" "}
        <strong>{orderNumber}</strong>.
      </p>
      <button
        type="button"
        onClick={confirm}
        disabled={loading}
        className="rounded-md bg-[var(--ink)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
      >
        {loading ? "Confirmando…" : "Simular pagamento recebido"}
      </button>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
