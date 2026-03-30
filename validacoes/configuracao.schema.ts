import { z } from "zod";

/**
 * Schema de validação para Settings / Configurações do Usuário.
 */
export const schemaAtualizarConfiguracao = z.object({
  name: z.string().min(1, "O nome não pode ser vazio").optional(),
  sessionDuration: z.number().int().min(1, "A duração da sessão deve ser maior que 0").optional(),
  autoLogoutMinutes: z.number().int().min(0, "A duração não pode ser negativa").optional(),
  darkMode: z.boolean().optional(),
  currency: z.enum(["BRL", "USD", "EUR"]).optional(),
  timezone: z.string().optional(),
});

/** Tipo inferido */
export type AtualizarConfiguracaoInput = z.infer<typeof schemaAtualizarConfiguracao>;
