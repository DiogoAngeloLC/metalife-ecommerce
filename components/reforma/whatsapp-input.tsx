"use client";

import { useEffect } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useWhatsappValidation } from "@/lib/use-whatsapp-validation";

function formatWhatsapp(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function WhatsappInput({
  value,
  onChange,
  onValidationChange,
  className = "",
  placeholder = "(11) 99999-9999",
}: {
  value: string;
  onChange: (formatted: string) => void;
  onValidationChange?: (valid: boolean) => void;
  className?: string;
  placeholder?: string;
}) {
  const { status, errorMsg, check } = useWhatsappValidation();

  const handleChange = (raw: string) => {
    const formatted = formatWhatsapp(raw);
    onChange(formatted);
    check(raw);
  };

  const digits = value.replace(/\D/g, "");
  const isComplete = digits.length >= 10;

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(status !== "invalid" && status !== "checking");
    }
  }, [status, onValidationChange]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        {status === "checking" && (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
        )}
        {status === "valid" && (
          <CheckCircle2 className="h-4 w-4 text-[var(--sage)]" />
        )}
        {status === "invalid" && (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
      {status === "invalid" && errorMsg && (
        <div className="mt-1 text-[11px] text-red-600">
          {errorMsg}
        </div>
      )}
      {status === "valid" && isComplete && (
        <div className="mt-1 text-[11px] text-[var(--sage)]">
          Número verificado no WhatsApp.
        </div>
      )}
    </div>
  );
}
