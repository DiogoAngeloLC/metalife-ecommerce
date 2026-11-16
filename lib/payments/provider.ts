import { randomUUID } from "crypto";
import type { PaymentMethod } from "@/lib/supabase/types";

export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  method: PaymentMethod;
  customer: {
    name: string;
    email: string;
    phone: string;
    document: string;
  };
  card?: {
    holderName: string;
    number: string;
    expiry: string; // MM/YY
    cvv: string;
  } | null;
};

export type PaymentResult = {
  provider: "asaas" | "mock";
  externalPaymentId: string;
  status: "pending" | "paid" | "canceled" | "failed";
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
  boletoUrl?: string | null;
  boletoDigitableLine?: string | null;
  raw: unknown;
};

function asaasConfigured(): boolean {
  const key = process.env.ASAAS_API_KEY?.trim();
  return Boolean(key && key !== "your-asaas-api-key");
}

function asaasBaseUrl(): string {
  const env = process.env.ASAAS_ENV === "production" ? "production" : "sandbox";
  return env === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";
}

function mockPixPayload(orderNumber: string, totalCents: number): string {
  // Payload fictício (não é EMV real) — suficiente para QR + copia e cola em sandbox local
  return `00020126580014BR.GOV.BCB.PIX0136${orderNumber}${totalCents}520400005303986540${(
    totalCents / 100
  ).toFixed(2)}5802BR5913METALIFE PILATES6009SAO PAULO62070503***6304ABCD`;
}

async function createMockPayment(input: CreatePaymentInput): Promise<PaymentResult> {
  const externalPaymentId = `mock_${input.orderNumber}_${randomUUID().slice(0, 8)}`;

  if (input.method === "pix") {
    const pixCopyPaste = mockPixPayload(input.orderNumber, input.totalCents);
    return {
      provider: "mock",
      externalPaymentId,
      status: "pending",
      pixCopyPaste,
      pixQrCode: pixCopyPaste,
      raw: { mock: true, method: "pix" },
    };
  }

  if (input.method === "boleto") {
    const line = `23793.38128 60000.000003 00000.000400 ${input.totalCents.toString().padStart(10, "0")}`;
    return {
      provider: "mock",
      externalPaymentId,
      status: "pending",
      boletoDigitableLine: line,
      boletoUrl: `https://example.com/boleto/${externalPaymentId}`,
      raw: { mock: true, method: "boleto" },
    };
  }

  // credit_card — mock aprova imediatamente
  return {
    provider: "mock",
    externalPaymentId,
    status: "paid",
    raw: { mock: true, method: "credit_card", approved: true },
  };
}

async function createAsaasPayment(input: CreatePaymentInput): Promise<PaymentResult> {
  const apiKey = process.env.ASAAS_API_KEY!;
  const base = asaasBaseUrl();
  const headers = {
    "Content-Type": "application/json",
    access_token: apiKey,
  };

  const customerRes = await fetch(`${base}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      cpfCnpj: input.customer.document,
      externalReference: input.orderId,
    }),
  });

  if (!customerRes.ok) {
    const text = await customerRes.text();
    throw new Error(`Asaas customer error: ${text.slice(0, 300)}`);
  }

  const customer = (await customerRes.json()) as { id: string };
  const billingType =
    input.method === "pix"
      ? "PIX"
      : input.method === "boleto"
        ? "BOLETO"
        : "CREDIT_CARD";

  const body: Record<string, unknown> = {
    customer: customer.id,
    billingType,
    value: input.totalCents / 100,
    dueDate: new Date().toISOString().slice(0, 10),
    description: `Pedido ${input.orderNumber} — Metalife Pilates`,
    externalReference: input.orderId,
  };

  if (input.method === "credit_card" && input.card) {
    const [month, year] = input.card.expiry.split("/");
    body.creditCard = {
      holderName: input.card.holderName,
      number: input.card.number.replace(/\D/g, ""),
      expiryMonth: month,
      expiryYear: year?.length === 2 ? `20${year}` : year,
      ccv: input.card.cvv,
    };
    body.creditCardHolderInfo = {
      name: input.customer.name,
      email: input.customer.email,
      cpfCnpj: input.customer.document,
      phone: input.customer.phone,
    };
  }

  const payRes = await fetch(`${base}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!payRes.ok) {
    const text = await payRes.text();
    throw new Error(`Asaas payment error: ${text.slice(0, 300)}`);
  }

  const payment = (await payRes.json()) as {
    id: string;
    status: string;
    bankSlipUrl?: string;
    identificationField?: string;
  };

  let pixCopyPaste: string | null = null;
  let pixQrCode: string | null = null;

  if (input.method === "pix") {
    const qrRes = await fetch(`${base}/payments/${payment.id}/pixQrCode`, {
      headers,
    });
    if (qrRes.ok) {
      const qr = (await qrRes.json()) as {
        encodedImage?: string;
        payload?: string;
      };
      pixCopyPaste = qr.payload ?? null;
      pixQrCode = qr.payload ?? null;
    }
  }

  const statusRaw = (payment.status || "").toUpperCase();
  const status: PaymentResult["status"] =
    statusRaw === "RECEIVED" || statusRaw === "CONFIRMED"
      ? "paid"
      : statusRaw === "REFUNDED" || statusRaw === "DELETED"
        ? "canceled"
        : "pending";

  return {
    provider: "asaas",
    externalPaymentId: payment.id,
    status,
    pixCopyPaste,
    pixQrCode,
    boletoUrl: payment.bankSlipUrl ?? null,
    boletoDigitableLine: payment.identificationField ?? null,
    raw: payment,
  };
}

/** Cria cobrança no Asaas ou mock (dev) quando ASAAS_API_KEY não está configurada. */
export async function createPayment(
  input: CreatePaymentInput
): Promise<PaymentResult> {
  if (asaasConfigured()) {
    return createAsaasPayment(input);
  }
  return createMockPayment(input);
}

export function getWebhookToken(): string | null {
  return process.env.ASAAS_WEBHOOK_TOKEN?.trim() || null;
}

export function isMockPaymentsEnabled(): boolean {
  return !asaasConfigured();
}

export type WebhookNormalizeResult = {
  externalPaymentId: string;
  status: "paid" | "canceled" | "ignored";
  rawEvent: string;
};

/** Normaliza eventos Asaas (ou mock) para status interno. */
export function normalizePaymentWebhook(
  body: unknown
): WebhookNormalizeResult | null {
  const payload = body as Record<string, unknown>;
  const event = String(payload.event ?? payload.type ?? "");
  const payment =
    (payload.payment as Record<string, unknown> | undefined) ??
    (payload.data as Record<string, unknown> | undefined) ??
    payload;

  const externalPaymentId = String(
    payment.id ?? payment.externalPaymentId ?? payload.externalPaymentId ?? ""
  );
  if (!externalPaymentId) return null;

  const paidEvents = [
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
    "payment.paid",
    "ORDER_PAID",
  ];
  const canceledEvents = [
    "PAYMENT_DELETED",
    "PAYMENT_REFUNDED",
    "PAYMENT_OVERDUE",
    "payment.canceled",
    "ORDER_CANCELED",
  ];

  if (paidEvents.includes(event) || payment.status === "RECEIVED" || payment.status === "paid") {
    return { externalPaymentId, status: "paid", rawEvent: event || "paid" };
  }
  if (
    canceledEvents.includes(event) ||
    payment.status === "DELETED" ||
    payment.status === "REFUNDED" ||
    payment.status === "canceled"
  ) {
    return { externalPaymentId, status: "canceled", rawEvent: event || "canceled" };
  }

  return { externalPaymentId, status: "ignored", rawEvent: event || "unknown" };
}
