import { z } from "zod";

/**
 * Schema de validação para criação de dívida.
 */
export const schemaCriarDivida = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  totalAmount: z.number().positive("Valor total deve ser positivo"),
  installmentValue: z.number().positive("Valor da parcela deve ser positivo"),
  installmentTotal: z
    .number()
    .int()
    .positive("Total de parcelas deve ser positivo"),
  installmentPaid: z.number().int().min(0).default(0),
  interestRate: z.number().nullable().optional(),
  amortizationType: z
    .enum(["SAC", "PRICE", "FIXED"])
    .nullable()
    .optional(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  nextDueDate: z.string().min(1, "Próximo vencimento é obrigatório"),
  accountId: z.string().min(1, "Conta é obrigatória"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  creditor: z.string().nullable().optional(),
  allowsPrepayment: z.boolean().default(true),
});

/** Tipo inferido do schema */
export type CriarDividaInput = z.infer<typeof schemaCriarDivida>;
