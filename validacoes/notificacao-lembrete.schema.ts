import { z } from "zod";

/**
 * Schema de validação para criação de lembrete/notificação.
 */
export const schemaCriarLembrete = z.object({
  titulo: z.string().min(1, "Título do lembrete é obrigatório"),
  mensagem: z.string().nullable().optional(),
  tipo: z.enum([
    "VENCIMENTO_DIVIDA",
    "ALERTA_ORCAMENTO",
    "RENOVACAO_ASSINATURA",
    "PROGRESSO_META",
    "VENCIMENTO_TRANSACAO",
    "ALERTA_LIMITE_CARTAO",
    "GERAL",
  ], {
    errorMap: () => ({ message: "Tipo de lembrete inválido" }),
  }),
  diasAntesDeNotificar: z.number().int().min(0).default(3),
  notificarEm: z.string().min(1, "Data de notificação é obrigatória"),
  referenciaId: z.string().nullable().optional(),
  referenciaTipo: z.string().nullable().optional(),
});

/**
 * Schema para atualizar estado de Lida (Batch ou único).
 */
export const schemaMarcarNotificacoes = z.object({
  ids: z.array(z.string()).optional(),
  marcarTodas: z.boolean().default(false),
}).refine(data => data.marcarTodas || (data.ids && data.ids.length > 0), {
  message: "Forneça os IDs ou marque 'marcarTodas' como true",
});

/** Tipos inferidos dos schemas */
export type CriarLembreteInput = z.infer<typeof schemaCriarLembrete>;
export type MarcarNotificacoesInput = z.infer<typeof schemaMarcarNotificacoes>;
