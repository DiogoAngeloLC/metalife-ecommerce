import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variants = cva(
  "inline-flex items-center justify-center font-display font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        action: "bg-[var(--action)] text-white hover:bg-[var(--action-dark)]",
        secondary: "border border-[var(--line-strong)] text-[var(--ink)] hover:bg-[var(--bg-section)]",
        dark: "bg-[var(--ink)] text-white hover:opacity-90",
        trust: "bg-[var(--trust)] text-white hover:bg-[var(--trust-dark)]",
        ghost: "text-[var(--ink-soft)] hover:bg-[var(--bg-section)]",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base",
        xl: "px-8 py-5 text-lg",
      },
    },
    defaultVariants: { variant: "action", size: "md" },
  }
);

export function ButtonAction({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "action" | "secondary" | "dark" | "trust" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return <button className={cn(variants({ variant, size }), className)} {...props} />;
}
