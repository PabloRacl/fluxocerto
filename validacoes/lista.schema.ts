import { z } from "zod";

/**
 * Schema para itens individuais dentro da Lista de Compras.
 */
const schemaListaItem = z.object({
  nome: z.string().min(1, "Nome do item é obrigatório"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero").default(1),
  unidade: z.string().default("un"),
  precoMaximo: z.number().min(0).nullable().optional(),
  observacao: z.string().nullable().optional(),
});

/**
 * Schema principal para criar Listas de Compras em Batch.
 */
export const schemaCriarLista = z.object({
  nome: z.string().min(1, "Nome da lista é obrigatório"),
  itens: z.array(schemaListaItem).optional().default([]),
});

/** Tipo inferido */
export type CriarListaInput = z.infer<typeof schemaCriarLista>;
