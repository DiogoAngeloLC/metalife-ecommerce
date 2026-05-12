import { z } from "zod";

export const ListingConditionEnum = z.enum([
  "novo",
  "seminovo",
  "usado_bom",
  "usado_regular",
]);

export const CreateListingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(3, "Mínimo 3 caracteres").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  equipment_type: z.string().trim().min(2, "Informe o tipo").max(80),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  year: z.coerce
    .number()
    .int()
    .min(1980)
    .max(new Date().getFullYear() + 1)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  condition: ListingConditionEnum,
  has_fixed_price: z.boolean(),
  price: z.coerce.number().min(0).max(9_999_999).optional(),
  is_negotiable: z.boolean(),
  city: z.string().trim().min(2).max(80),
  state: z
    .string()
    .trim()
    .length(2, "UF tem 2 letras")
    .transform((v) => v.toUpperCase()),
  imagePaths: z.array(z.string()).max(8),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

export const UpdateVendorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(10).max(13)),
  city: z.string().trim().min(2).max(80),
  state: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase()),
});

export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
