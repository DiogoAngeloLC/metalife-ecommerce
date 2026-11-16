import type { ShippingAddress } from "@/lib/supabase/types";

export type ProtheusExportOrder = {
  order_number: string;
  created_at: string;
  status: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string;
  buyer_company_name: string | null;
  buyer_state_registration: string | null;
  shipping_address: ShippingAddress | null;
  payment_method: string | null;
  total_cents: number;
  order_items: Array<{
    title_snapshot: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
    protheus_code_snapshot: string | null;
    str_code_snapshot: string | null;
    stf_code_snapshot: string | null;
  }> | null;
};

const HEADERS = [
  "pedido",
  "data",
  "status",
  "comprador",
  "email",
  "telefone",
  "documento",
  "razao_social",
  "inscricao_estadual",
  "cep",
  "cidade",
  "uf",
  "pagamento",
  "produto",
  "protheus_code",
  "str_code",
  "stf_code",
  "quantidade",
  "preco_unitario",
  "total_item",
  "total_pedido",
] as const;

function cell(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  const escaped = raw.replace(/"/g, '""');
  if (/[;"\n\r]/.test(escaped)) return `"${escaped}"`;
  return escaped;
}

function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** CSV UTF-8 BOM, separador `;`, uma linha por item do pedido. */
export function buildProtheusCsv(orders: ProtheusExportOrder[]): string {
  const lines: string[] = [HEADERS.join(";")];

  for (const order of orders) {
    const items = order.order_items?.length
      ? order.order_items
      : [
          {
            title_snapshot: "",
            quantity: 0,
            unit_price_cents: 0,
            total_cents: 0,
            protheus_code_snapshot: null,
            str_code_snapshot: null,
            stf_code_snapshot: null,
          },
        ];

    const addr = order.shipping_address;
    for (const item of items) {
      lines.push(
        [
          cell(order.order_number),
          cell(new Date(order.created_at).toLocaleString("pt-BR")),
          cell(order.status),
          cell(order.buyer_name),
          cell(order.buyer_email),
          cell(order.buyer_phone),
          cell(order.buyer_document),
          cell(order.buyer_company_name),
          cell(order.buyer_state_registration),
          cell(addr?.cep),
          cell(addr?.city),
          cell(addr?.state),
          cell(order.payment_method),
          cell(item.title_snapshot),
          cell(item.protheus_code_snapshot),
          cell(item.str_code_snapshot),
          cell(item.stf_code_snapshot),
          cell(item.quantity),
          cell(centsToDecimal(item.unit_price_cents)),
          cell(centsToDecimal(item.total_cents)),
          cell(centsToDecimal(order.total_cents)),
        ].join(";")
      );
    }
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadProtheusCsv(orders: ProtheusExportOrder[], filename: string) {
  const csv = buildProtheusCsv(orders);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
