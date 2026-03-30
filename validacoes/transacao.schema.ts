import { z } from "zod";

/**
 * Schema de validação para criação de transação.
 */
export const schemaCriarTransacao = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().positive("Valor deve ser um número positivo em centavos"),
  type: z.enum(["INCOME", "EXPENSE"], {
    errorMap: () => ({ message: "Tipo inválido (use INCOME ou EXPENSE)" }),
  }),
  accountId: z.string().min(1, "Conta é obrigatória"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  occurrenceDate: z.string().min(1, "Data de ocorrência é obrigatória"),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["PENDING", "PAID", "CANCELLED"]).default("PAID"),
  notes: z.string().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z
    .enum([
      "DAILY",
      "WEEKLY",
      "BIWEEKLY",
      "MONTHLY",
      "BIMONTHLY",
      "QUARTERLY",
      "SEMIANNUAL",
      "ANNUAL",
    ])
    .nullable()
    .optional(),
  recurrenceDay: z.number().nullable().optional(),
  isInstallment: z.boolean().default(false),
  installmentTotal: z.number().nullable().optional(),
  installmentCurrent: z.number().nullable().optional(),
  installmentId: z.string().nullable().optional(),
});

/** Tipo inferido do schema */
export type CriarTransacaoInput = z.infer<typeof schemaCriarTransacao>;
