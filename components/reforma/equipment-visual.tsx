import { cn } from "@/lib/utils";

type ListingAccent = "sage" | "terracota";

const colors: Record<
  ListingAccent,
  { from: string; via: string; to: string }
> = {
  sage: { from: "#A8B5A0", via: "#7A8B6F", to: "#5C6B53" },
  terracota: { from: "#D4926D", via: "#B85C3F", to: "#9D4D33" },
};

const noiseSvg =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function EquipmentVisual({
  equipment,
  accent = "sage",
  className,
}: {
  equipment: string;
  accent?: ListingAccent;
  className?: string;
}) {
  const c = colors[accent] ?? colors.sage;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${c.from} 0%, ${c.via} 60%, ${c.to} 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: noiseSvg }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="font-display text-3xl font-light tracking-wide opacity-80 md:text-5xl mb-1">
          {equipment.charAt(0)}
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] opacity-60 md:text-xs">
          {equipment}
        </div>
      </div>
    </div>
  );
}
