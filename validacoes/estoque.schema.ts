import { z } from "zod";

/**
 * Schema de validação para criação de item de estoque.
 */
export const schemaCriarEstoque = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().nullable().optional(),
  quantidade: z.number().min(0, "Quantidade não pode ser negativa").default(0),
  unidade: z.string().default("un"),
  precoMedio: z.number().min(0, "Preço médio não pode ser negativo").optional(),
  precoUltimo: z
    .number()
    .min(0, "Preço último não pode ser negativo")
    .optional(),
  validade: z.string().datetime({ offset: true }).nullable().optional(),
  estoqueMinimo: z.number().min(0).default(1),
});

/**
 * Schema de validação para atualização de item de estoque.
 * Todos os campos são opcionais.
 */
export const schemaAtualizarEstoque = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  categoria: z.string().nullable().optional(),
  quantidade: z.number().min(0, "Quantidade não pode ser negativa").optional(),
  unidade: z.string().optional(),
  precoMedio: z.number().min(0).optional(),
  precoUltimo: z.number().min(0).optional(),
  ultimaCompra: z.string().datetime({ offset: true }).nullable().optional(),
  validade: z.string().datetime({ offset: true }).nullable().optional(),
  estoqueMinimo: z.number().min(0).optional(),
  ativo: z.boolean().optional(),
});

/** Tipos inferidos dos schemas */
export type CriarEstoqueInput = z.infer<typeof schemaCriarEstoque>;
export type AtualizarEstoqueInput = z.infer<typeof schemaAtualizarEstoque>;
