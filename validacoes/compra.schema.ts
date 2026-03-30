import { z } from "zod";

/**
 * Schema para item individual dentro de uma compra.
 */
const schemaItemCompra = z.object({
  name: z.string().min(1, "Nome do item é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  unit: z.string().nullable().optional(),
  unitPrice: z.number().min(0, "Preço unitário não pode ser negativo"),
  category: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
});

/**
 * Schema de validação principal para criação de Compra.
 */
export const schemaCriarCompra = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  totalAmount: z.number().min(0, "Valor total não pode ser negativo"),
  purchaseDate: z.string().min(1, "Data da compra é obrigatória"),
  storeName: z.string().nullable().optional(),
  paymentMethod: z.enum([
    "CASH",
    "DEBIT_CARD",
    "CREDIT_CARD",
    "PIX",
    "BANK_TRANSFER",
    "OTHER",
  ], {
    errorMap: () => ({ message: "Forma de pagamento inválida" }),
  }),
  accountId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  items: z.array(schemaItemCompra).optional().default([]),
  isInstallment: z.boolean().default(false),
  installmentTotal: z.number().nullable().optional(),
  installmentValue: z.number().nullable().optional(),
  gerarTransacao: z.boolean().default(true),
  itemMappings: z
    .array(
      z.object({
        name: z.string(),
        categoryId: z.string().nullable().optional(),
        accountId: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
});

/** Tipo inferido do schema principal */
export type CriarCompraInput = z.infer<typeof schemaCriarCompra>;
