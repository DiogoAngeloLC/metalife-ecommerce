"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "checking" | "valid" | "invalid" | "unavailable";

const errorMessages: Record<string, string> = {
  not_on_whatsapp: "Este número não tem WhatsApp ativo.",
  invalid_format: "Formato de número inválido.",
  service_unavailable: "Serviço de validação indisponível. Tente novamente em instantes.",
  phone_required: "Informe um número.",
  internal_error: "Erro ao validar. Tente novamente.",
};

/** Quando a API Evolution não está configurada ou fora do ar, ainda permitimos o envio do lead. */
const UNAVAILABLE_HINT =
  "Não foi possível confirmar o WhatsApp agora. Confira DDD e número — você pode enviar mesmo assim.";

export function useWhatsappValidation(debounceMs = 800) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warnMsg, setWarnMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChecked = useRef<string>("");

  const check = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, "");

      if (digits.length < 10) {
        setStatus("idle");
        setErrorMsg(null);
        setWarnMsg(null);
        lastChecked.current = "";
        return;
      }

      if (digits === lastChecked.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      setStatus("checking");
      setErrorMsg(null);
      setWarnMsg(null);

      timerRef.current = setTimeout(async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.functions.invoke("check-whatsapp", {
            body: { phone: digits },
          });

          lastChecked.current = digits;

          if (error) {
            setStatus("unavailable");
            setErrorMsg(null);
            setWarnMsg(UNAVAILABLE_HINT);
            return;
          }

          if (data?.valid) {
            setStatus("valid");
            setErrorMsg(null);
            setWarnMsg(null);
            return;
          }

          const reason = data?.reason as string | undefined;
          if (
            reason === "service_unavailable" ||
            reason === "internal_error"
          ) {
            setStatus("unavailable");
            setErrorMsg(null);
            setWarnMsg(UNAVAILABLE_HINT);
            return;
          }

          setStatus("invalid");
          setWarnMsg(null);
          setErrorMsg(
            (reason && errorMessages[reason as keyof typeof errorMessages]) ??
              "Não foi possível validar este número."
          );
        } catch {
          lastChecked.current = digits;
          setStatus("unavailable");
          setErrorMsg(null);
          setWarnMsg(UNAVAILABLE_HINT);
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { status, errorMsg, warnMsg, check };
}
