import { z } from "zod";

/**
 * Schema de validação para criação de meta.
 */
export const schemaCriarMeta = z.object({
  nome: z.string().min(1, "Nome da meta é obrigatório"),
  descricao: z.string().nullable().optional(),
  valorAlvo: z.number().positive("Valor alvo deve ser positivo e maior que zero"),
  montanteAtual: z.number().min(0, "Montante atual não pode ser negativo").default(0),
  prazo: z.string().nullable().optional(),
  categoriaId: z.string().nullable().optional(),
  icone: z.string().nullable().optional(),
  cor: z.string().default("#10B981"),
});

/** Tipo inferido do schema */
export type CriarMetaInput = z.infer<typeof schemaCriarMeta>;
