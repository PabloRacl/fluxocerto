import { z } from "zod";

/**
 * Enum de tipos de Ativos (Assets) para consistência Zod.
 */
export const AssetTypeEnum = z.enum([
  "IMOVEL",
  "VEICULO",
  "INVESTIMENTO_FIXO",
  "EQUIPAMENTO",
  "JOIA_ARTE",
  "OUTROS",
]);

/**
 * Schema para criação de um novo ativo/bem.
 */
export const schemaCriarAsset = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional().nullable(),
  tipo: AssetTypeEnum.default("OUTROS"),
  valorCompra: z.number().min(0, "Valor de compra não pode ser negativo"),
  valorAtual: z.number().min(0, "Valor atual não pode ser negativo").optional(),
  dataCompra: z.string().datetime({ offset: true }).optional().nullable(),
  instituicao: z.string().optional().nullable(),
  cor: z.string().default("#047857"),
  icone: z.string().optional().nullable(),
});

/**
 * Schema para atualização de um ativo existente.
 */
export const schemaAtualizarAsset = schemaCriarAsset.partial();

export type CriarAssetInput = z.infer<typeof schemaCriarAsset>;
export type AtualizarAssetInput = z.infer<typeof schemaAtualizarAsset>;
