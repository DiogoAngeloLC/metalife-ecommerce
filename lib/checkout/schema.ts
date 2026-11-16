import { z } from "zod";
import { digitsOnly, isValidCpfOrCnpj } from "@/lib/documents";

export const CheckoutCartItemSchema = z.object({
  listingId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const CreateOrderSchema = z
  .object({
    buyer_name: z.string().trim().min(3, "Informe o nome completo").max(120),
    buyer_email: z.string().trim().toLowerCase().email("E-mail inválido"),
    buyer_phone: z
      .string()
      .transform((v) => digitsOnly(v))
      .pipe(z.string().min(10, "WhatsApp inválido").max(13)),
    buyer_document: z
      .string()
      .transform((v) => digitsOnly(v))
      .refine(isValidCpfOrCnpj, "CPF ou CNPJ inválido"),
    buyer_company_name: z.string().trim().max(180).optional().nullable(),
    buyer_state_registration: z.string().trim().max(40).optional().nullable(),
    ie_isento: z.boolean().optional(),
    shipping_address: z.object({
      cep: z
        .string()
        .transform((v) => digitsOnly(v))
        .pipe(z.string().length(8, "CEP inválido")),
      street: z.string().trim().min(2).max(120),
      number: z.string().trim().min(1).max(20),
      complement: z.string().trim().max(80).optional().nullable(),
      neighborhood: z.string().trim().min(2).max(80),
      city: z.string().trim().min(2).max(80),
      state: z
        .string()
        .trim()
        .length(2)
        .transform((v) => v.toUpperCase()),
    }),
    shipping_rule_id: z.string().uuid("Selecione uma opção de frete"),
    payment_method: z.enum(["pix", "credit_card", "boleto"]),
    opt_in: z.boolean().refine((v) => v === true, {
      message: "É necessário aceitar os Termos e a Política de Privacidade",
    }),
    items: z.array(CheckoutCartItemSchema).min(1, "Carrinho vazio"),
    card_holder: z.string().trim().max(120).optional(),
    card_number: z.string().optional(),
    card_expiry: z.string().optional(),
    card_cvv: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const doc = digitsOnly(data.buyer_document);
    if (doc.length === 14) {
      if (!data.buyer_company_name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["buyer_company_name"],
          message: "Razão Social obrigatória para CNPJ",
        });
      }
      if (data.ie_isento) return;
      if (!data.buyer_state_registration?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["buyer_state_registration"],
          message: "Informe a Inscrição Estadual ou marque Isento",
        });
      }
    }
  });

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
