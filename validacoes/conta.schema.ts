import { z } from "zod";

/**
 * Schema de validação para criação de conta.
 */
export const schemaCriarConta = z.object({
  name: z.string().min(1, "Nome da conta é obrigatório"),
  type: z.enum(
    [
      "CHECKING",
      "SAVINGS",
      "CREDIT_CARD",
      "DEBIT_CARD",
      "CASH",
      "INVESTMENT",
      "PIX",
      "OTHER",
    ],
    {
      errorMap: () => ({ message: "Tipo de conta inválido" }),
    },
  ),
  balance: z
    .number()
    .or(z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Formato de saldo inválido"))
    .optional()
    .transform((val) => {
      if (!val) return 0;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return Math.round(num * 100);
    }),
  color: z.string().optional().default("#047857"),
  icon: z.string().nullable().optional(),
});

/** Tipo inferido do schema */
export type CriarContaInput = z.infer<typeof schemaCriarConta>;
