"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "checking" | "valid" | "invalid";

const errorMessages: Record<string, string> = {
  not_on_whatsapp: "Este número não tem WhatsApp ativo.",
  invalid_format: "Formato de número inválido.",
  service_unavailable: "Serviço de validação indisponível. Tente novamente em instantes.",
  phone_required: "Informe um número.",
  internal_error: "Erro ao validar. Tente novamente.",
};

export function useWhatsappValidation(debounceMs = 800) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChecked = useRef<string>("");

  const check = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, "");

      if (digits.length < 10) {
        setStatus("idle");
        setErrorMsg(null);
        return;
      }

      if (digits === lastChecked.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      setStatus("checking");
      setErrorMsg(null);

      timerRef.current = setTimeout(async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase.functions.invoke("check-whatsapp", {
            body: { phone: digits },
          });

          lastChecked.current = digits;

          if (data?.valid) {
            setStatus("valid");
            setErrorMsg(null);
          } else {
            setStatus("invalid");
            setErrorMsg(
              errorMessages[data?.reason] ?? "Não foi possível validar este número."
            );
          }
        } catch {
          setStatus("invalid");
          setErrorMsg("Erro ao validar. Tente novamente.");
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

  return { status, errorMsg, check };
}
