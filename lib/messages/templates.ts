import type { Database } from "@/lib/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
}

function digitsOnly(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

const SIGNATURE = "_(Mensagem automática — não responder)_";

export function buildLeadToBuyer(args: {
  buyer_name: string;
  listing: Pick<Listing, "title" | "city" | "state" | "price" | "has_fixed_price">;
  vendor: { name: string | null; whatsapp: string | null };
  site_url: string;
}): string {
  const { buyer_name, listing, vendor, site_url } = args;
  const firstName = buyer_name.split(" ")[0];
  const priceLine =
    listing.has_fixed_price && listing.price
      ? ` — ${fmtBRL(Number(listing.price))}`
      : "";
  const vendorPhone = digitsOnly(vendor.whatsapp);

  return `Olá, ${firstName}! 👋

Aqui é a *Loja Oficial Metalife Pilates*.

Você demonstrou interesse em:
*${listing.title}*
${listing.city}, ${listing.state}${priceLine}

📞 *Contato do vendedor:*
${vendor.name ?? "Vendedor"}
https://wa.me/${vendorPhone}

Pode falar direto com ele(a). Boa negociação! 🌱

Veja outros anúncios em: ${site_url}

${SIGNATURE}`;
}

export function buildLeadToSeller(args: {
  vendor_name: string;
  buyer: { name: string; whatsapp: string; email: string };
  listing: Pick<Listing, "title">;
  site_url: string;
}): string {
  const { vendor_name, buyer, listing, site_url } = args;
  const firstName = (vendor_name ?? "").split(" ")[0] || "Você";
  const buyerPhone = digitsOnly(buyer.whatsapp);

  return `Olá, ${firstName}! 🌱

Você recebeu um novo interessado em:
*${listing.title}*

👤 *Interessado:*
${buyer.name}
https://wa.me/${buyerPhone}
${buyer.email}

Eles já receberam seu contato e podem te chamar a qualquer momento.

Acompanhe todos os seus leads: ${site_url}/dashboard

${SIGNATURE}`;
}

export function buildListingApproved(args: {
  vendor_name: string;
  listing: Pick<Listing, "title" | "slug">;
  site_url: string;
}): string {
  const firstName = (args.vendor_name ?? "").split(" ")[0] || "Olá";
  return `✅ ${firstName}, seu anúncio foi aprovado!

*${args.listing.title}*

Já está visível na Loja Oficial Metalife Pilates.

Ver anúncio: ${args.site_url}/${args.listing.slug}

${SIGNATURE}`;
}

export function buildListingRejected(args: {
  vendor_name: string;
  listing: Pick<Listing, "title">;
  reason: string;
  site_url: string;
}): string {
  const firstName = (args.vendor_name ?? "").split(" ")[0] || "Olá";
  return `⚠️ ${firstName}, seu anúncio não foi aprovado.

*${args.listing.title}*

*Motivo informado:*
${args.reason}

Você pode editar e reenviar a qualquer momento em:
${args.site_url}/dashboard

${SIGNATURE}`;
}
