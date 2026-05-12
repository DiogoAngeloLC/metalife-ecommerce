import { cn } from "@/lib/utils";

const STYLES = {
  action: "bg-[var(--action)] text-white",
  trust: "bg-[var(--trust)] text-white",
  warning: "bg-[var(--warning)] text-white",
  success: "bg-[var(--success)] text-white",
  neutral: "bg-[var(--bg-section)] text-[var(--ink-soft)] border border-[var(--line)]",
  ghost: "bg-transparent border border-[var(--line-strong)] text-[var(--ink-soft)]",
} as const;

export function BadgePill({
  variant = "neutral",
  children,
  className,
}: {
  variant?: keyof typeof STYLES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
