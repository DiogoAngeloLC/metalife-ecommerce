"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "checking" | "valid" | "invalid";

export function useWhatsappValidation(debounceMs = 800) {
  const [status, setStatus] = useState<Status>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChecked = useRef<string>("");

  const check = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, "");

      if (digits.length < 10) {
        setStatus("idle");
        return;
      }

      if (digits === lastChecked.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      setStatus("checking");

      timerRef.current = setTimeout(async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase.functions.invoke("check-whatsapp", {
            body: { phone: digits },
          });

          lastChecked.current = digits;

          if (data?.valid) {
            setStatus("valid");
          } else {
            setStatus("invalid");
          }
        } catch {
          // On error, don't block the user
          setStatus("valid");
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

  return { status, check };
}
