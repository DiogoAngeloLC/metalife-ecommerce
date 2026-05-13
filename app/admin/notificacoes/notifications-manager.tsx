"use client";

import { useState, useTransition } from "react";
import {
  updateNotificationSettingsAction,
  generateSecretAction,
  testWebhookAction,
} from "./actions";
import type { NotificationSettings } from "@/lib/notifications";
import {
  Globe,
  MessageSquare,
  Copy,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

type WebhookLog = {
  id: string;
  url: string;
  event_type: string;
  status_code: number | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
};

export function NotificationsManager({
  settings: initial,
  logs,
}: {
  settings: NotificationSettings;
  logs: WebhookLog[];
}) {
  const [settings, setSettings] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const save = (next: NotificationSettings) => {
    setSettings(next);
    startTransition(async () => {
      try {
        await updateNotificationSettingsAction(next);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  };

  const handleGenerateSecret = () => {
    startTransition(async () => {
      try {
        const secret = await generateSecretAction();
        const next = {
          ...settings,
          webhook: { ...settings.webhook, secret },
        };
        setSettings(next);
        await updateNotificationSettingsAction(next);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro");
      }
    });
  };

  const handleTest = () => {
    setTestResult(null);
    startTransition(async () => {
      try {
        const result = await testWebhookAction();
        setTestResult({
          ok: result.ok,
          message: result.ok
            ? `OK (HTTP ${result.status})`
            : result.error ?? `Falhou (HTTP ${result.status})`,
        });
      } catch (err) {
        setTestResult({
          ok: false,
          message: err instanceof Error ? err.message : "Erro",
        });
      }
    });
  };

  const copySecret = () => {
    if (settings.webhook.secret) {
      navigator.clipboard.writeText(settings.webhook.secret);
    }
  };

  return (
    <div className="space-y-6">
      {/* Webhook Card */}
      <div className="border border-[var(--line)] bg-white">
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-[var(--action)]" />
            <div>
              <h2 className="font-display text-base font-bold uppercase">
                Webhook HTTP
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Envia POST com payload JSON e assinatura HMAC
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.webhook.enabled}
              onChange={(e) =>
                save({
                  ...settings,
                  webhook: { ...settings.webhook, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--action)]" />
          </label>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">
              URL do webhook
            </label>
            <input
              type="url"
              value={settings.webhook.url ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  webhook: {
                    ...settings.webhook,
                    url: e.target.value || null,
                  },
                })
              }
              onBlur={() => save(settings)}
              placeholder="https://..."
              className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">
              Secret (HMAC SHA-256)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={settings.webhook.secret ?? ""}
                className="flex-1 border border-[var(--line)] px-3 py-2 text-sm outline-none font-mono bg-[var(--bg-section)]"
                placeholder="Nenhum secret gerado"
              />
              <button
                type="button"
                onClick={copySecret}
                className="p-2 border border-[var(--line)] hover:bg-[var(--bg-section)] transition"
                title="Copiar"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleGenerateSecret}
                disabled={isPending}
                className="p-2 border border-[var(--line)] hover:bg-[var(--bg-section)] transition"
                title="Gerar novo secret"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTest}
              disabled={isPending || !settings.webhook.url}
              className="flex items-center gap-2 bg-[var(--action)] text-white px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-[var(--action-dark)] disabled:opacity-40 transition"
            >
              <Send className="h-4 w-4" />
              Testar webhook
            </button>
            {testResult && (
              <span
                className={`flex items-center gap-1 text-sm ${
                  testResult.ok ? "text-[var(--trust)]" : "text-[var(--danger)]"
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {testResult.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Admin Card */}
      <div className="border border-[var(--line)] bg-white">
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-[var(--trust)]" />
            <div>
              <h2 className="font-display text-base font-bold uppercase">
                WhatsApp Admin
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Envia mensagem para o administrador via WhatsApp
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.whatsapp_admin.enabled}
              onChange={(e) =>
                save({
                  ...settings,
                  whatsapp_admin: {
                    ...settings.whatsapp_admin,
                    enabled: e.target.checked,
                  },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--trust)]" />
          </label>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">
              Telefone do admin
            </label>
            <input
              type="tel"
              value={settings.whatsapp_admin.phone ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  whatsapp_admin: {
                    ...settings.whatsapp_admin,
                    phone: e.target.value || null,
                  },
                })
              }
              onBlur={() => save(settings)}
              placeholder="5511999999999"
              className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">
              Template da mensagem
            </label>
            <textarea
              rows={8}
              value={settings.whatsapp_admin.message_template ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  whatsapp_admin: {
                    ...settings.whatsapp_admin,
                    message_template: e.target.value || null,
                  },
                })
              }
              onBlur={() => save(settings)}
              placeholder="Use {{lead_name}}, {{listing_title}}, {{listing_city}}, {{listing_state}}, {{listing_price}}, {{lead_whatsapp}}, {{lead_email}}, {{admin_url}}"
              className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none font-mono"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Variáveis:{" "}
              <code className="bg-[var(--bg-section)] px-1">
                {"{{lead_name}}"}
              </code>{" "}
              <code className="bg-[var(--bg-section)] px-1">
                {"{{listing_title}}"}
              </code>{" "}
              <code className="bg-[var(--bg-section)] px-1">
                {"{{listing_city}}"}
              </code>{" "}
              <code className="bg-[var(--bg-section)] px-1">
                {"{{listing_state}}"}
              </code>{" "}
              <code className="bg-[var(--bg-section)] px-1">
                {"{{listing_price}}"}
              </code>{" "}
              <code className="bg-[var(--bg-section)] px-1">
                {"{{lead_whatsapp}}"}
              </code>{" "}
              <code className="bg-[var(--bg-section)] px-1">
                {"{{lead_email}}"}
              </code>{" "}
              <code className="bg-[var(--bg-section)] px-1">
                {"{{admin_url}}"}
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Webhook Logs */}
      <div className="border border-[var(--line)] bg-white">
        <div className="p-4 border-b border-[var(--line)]">
          <h2 className="font-display text-base font-bold uppercase">
            Log de webhooks
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Últimas 20 chamadas (auto-limpeza mantém 100)
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Nenhum webhook disparado ainda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--bg-section)]">
                  <th className="text-left px-4 py-2 text-label-bold text-[var(--text-muted)]">
                    Status
                  </th>
                  <th className="text-left px-4 py-2 text-label-bold text-[var(--text-muted)]">
                    URL
                  </th>
                  <th className="text-left px-4 py-2 text-label-bold text-[var(--text-muted)]">
                    Tempo
                  </th>
                  <th className="text-left px-4 py-2 text-label-bold text-[var(--text-muted)]">
                    Data
                  </th>
                  <th className="text-left px-4 py-2 text-label-bold text-[var(--text-muted)]">
                    Erro
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-1">
                        {log.status_code && log.status_code < 400 ? (
                          <CheckCircle className="h-3.5 w-3.5 text-[var(--trust)]" />
                        ) : log.error_message ? (
                          <XCircle className="h-3.5 w-3.5 text-[var(--danger)]" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        )}
                        <span className="font-mono text-xs">
                          {log.status_code ?? "—"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-2 max-w-[200px] truncate font-mono text-xs">
                      {log.url}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {log.duration_ms != null ? `${log.duration_ms}ms` : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-[var(--text-muted)]">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 max-w-[200px] truncate text-xs text-[var(--danger)]">
                      {log.error_message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
