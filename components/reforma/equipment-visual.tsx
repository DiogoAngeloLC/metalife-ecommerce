import { cn } from "@/lib/utils";

const LINE_LABELS: Record<string, string> = {
  reformer: "Reformer",
  cadillac: "Cadillac",
  "wall-unit": "Wall Unit",
  "wall unit": "Wall Unit",
  chair: "Chair",
  barrel: "Barrel",
  acessorios: "Acessórios",
  acessórios: "Acessórios",
};

function lineLabel(equipment: string, title?: string | null): string {
  const key = equipment.trim().toLowerCase();
  if (LINE_LABELS[key]) return LINE_LABELS[key];

  const hay = `${title ?? ""} ${equipment}`.toLowerCase();
  if (hay.includes("infinity")) return "Infinity 2025";
  if (hay.includes("w23") || hay.includes("eco")) return "W23 ECO";
  if (hay.includes("classic") || hay.includes("classica") || hay.includes("clássica")) {
    return "Classic";
  }
  if (hay.includes("reformer")) return "Reformer";
  if (hay.includes("cadillac")) return "Cadillac";
  if (hay.includes("wall")) return "Wall Unit";
  if (hay.includes("chair") || hay.includes("wunda")) return "Chair";
  if (hay.includes("barrel")) return "Barrel";
  return equipment.charAt(0).toUpperCase() + equipment.slice(1);
}

/**
 * Placeholder Metalife (#008591) para cards sem foto em listing_images.
 */
export function EquipmentVisual({
  equipment,
  title,
  className,
}: {
  equipment: string;
  title?: string | null;
  /** @deprecated Mantido por compatibilidade — identidade visual é sempre Metalife teal. */
  accent?: string;
  className?: string;
}) {
  const label = lineLabel(equipment, title);
  const initial = label.charAt(0).toUpperCase();

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(145deg, #008591 0%, #006f79 55%, #0f172a 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #ffffff 0%, transparent 45%), radial-gradient(circle at 80% 80%, #00c2d1 0%, transparent 40%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
        <div className="mb-2 font-display text-4xl font-black tracking-tight opacity-90 md:text-5xl">
          {initial}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/80 md:text-xs">
          Metalife Pilates
        </div>
        <div className="mt-2 max-w-[90%] truncate text-[11px] font-semibold uppercase tracking-wider text-white/70 md:text-xs">
          {label}
        </div>
      </div>
    </div>
  );
}
