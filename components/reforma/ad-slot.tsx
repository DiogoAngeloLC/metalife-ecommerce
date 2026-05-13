"use client";

import Link from "next/link";

type Banner = {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string;
};

export function AdSlot({
  banners,
  orientation = "vertical",
  className = "",
}: {
  banners: Banner[];
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  if (banners.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {banners.map((b) => {
        const inner = (
          <div
            className={`relative overflow-hidden border border-[var(--line)] bg-[var(--bg-section)] ${
              orientation === "horizontal" ? "aspect-[6/1]" : "aspect-[3/4]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image_url} alt={b.alt_text} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-white/90 text-[var(--text-muted)] px-1.5 py-0.5">
              Publicidade
            </div>
          </div>
        );
        return b.link_url ? (
          <Link key={b.id} href={b.link_url} target="_blank" rel="noopener noreferrer sponsored">
            {inner}
          </Link>
        ) : (
          <div key={b.id}>{inner}</div>
        );
      })}
    </div>
  );
}
