import { z } from "zod";

/**
 * Schema de validação para criação de Assinatura.
 */
export const schemaCriarAssinatura = z.object({
  nome: z.string().min(1, "Nome da assinatura é obrigatório"),
  descricao: z.string().nullable().optional(),
  valor: z.number().positive("Valor deve ser maior que zero (em centavos)"),
  ciclo: z.enum([
    "SEMANAL",
    "QUINZENAL",
    "MENSAL",
    "BIMESTRAL",
    "TRIMESTRAL",
    "SEMESTRAL",
    "ANUAL",
  ], {
    errorMap: () => ({ message: "Ciclo de faturamento inválido" }),
  }),
  proximaRenovacao: z.string().min(1, "Data de renovação é obrigatória"),
  categoriaId: z.string().nullable().optional(),
  contaId: z.string().nullable().optional(),
});

/** Tipo inferido do schema principal */
export type CriarAssinaturaInput = z.infer<typeof schemaCriarAssinatura>;
