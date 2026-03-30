import { z } from "zod";

/**
 * Schema de validação para criação de categoria.
 */
export const schemaCriarCategoria = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  type: z.enum(["INCOME", "EXPENSE"], {
    errorMap: () => ({ message: "Tipo deve ser INCOME ou EXPENSE" }),
  }),
  color: z.string().optional().default("#047857"),
  icon: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

/** Tipo inferido do schema */
export type CriarCategoriaInput = z.infer<typeof schemaCriarCategoria>;
