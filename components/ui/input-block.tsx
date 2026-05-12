import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const InputBlock = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full border border-[var(--line)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--action)]",
        className
      )}
      {...props}
    />
  )
);
InputBlock.displayName = "InputBlock";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-label-bold text-[var(--ink-soft)] block mb-2">{children}</label>
  );
}
