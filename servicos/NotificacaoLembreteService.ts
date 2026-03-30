import { prisma } from "@/biblioteca/prisma";
import type {
  CriarLembreteInput,
  MarcarNotificacoesInput,
} from "@/validacoes/notificacao-lembrete.schema";

/**
 * Serviço de Notificações e Lembretes.
 * Processamento e Listagem de alertas gerados via `Lembrete`.
 */
export class NotificacaoLembreteService {
  /**
   * Lista notificações filtrando por apenas lidas caso parametrizado.
   */
  async listar(usuarioId: string, limitador: { apenasNaoLidas: boolean }) {
    const where: any = { usuarioId };
    if (limitador.apenasNaoLidas) where.lido = false;

    // Lembrete da própria tabela Database Lembrete = Notification Center.
    const notificacoes = await prisma.lembrete.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      take: 50,
    });

    const naoLidas = await prisma.lembrete.count({
      where: { usuarioId, lido: false },
    });

    return { notificacoes, naoLidas };
  }

  /**
   * Lista explicitamente lembretes (modo painel listagem)
   */
  async listarLembretes(usuarioId: string, limitador: { showRead: boolean }) {
    const lembretes = await prisma.lembrete.findMany({
      where: { usuarioId, lido: limitador.showRead ? undefined : false },
      orderBy: { notificarEm: "asc" },
    });

    const totalNaoLidos = await prisma.lembrete.count({
      where: { usuarioId, lido: false },
    });

    return { lembretes, totalNaoLidos };
  }

  /**
   * Cria Notificação / Lembrete
   */
  async criar(usuarioId: string, dados: CriarLembreteInput) {
    return prisma.lembrete.create({
      data: {
        usuarioId,
        titulo: dados.titulo,
        mensagem: dados.mensagem || null,
        tipo: dados.tipo as any,
        diasAntesDeNotificar: dados.diasAntesDeNotificar,
        notificarEm: new Date(dados.notificarEm),
        referenciaId: dados.referenciaId || null,
        referenciaTipo: dados.referenciaTipo || null,
      },
    });
  }

  /**
   * Marcar notificações em massa (PATCH route abstrato)
   */
  async marcarComoLidas(usuarioId: string, dados: MarcarNotificacoesInput) {
    if (dados.marcarTodas) {
      await prisma.lembrete.updateMany({
        where: { usuarioId, lido: false },
        data: { lido: true, lidoEm: new Date() },
      });
    } else if (dados.ids && dados.ids.length > 0) {
      await prisma.lembrete.updateMany({
        where: { id: { in: dados.ids }, usuarioId },
        data: { lido: true, lidoEm: new Date() },
      });
    }

    return true;
  }
}

export const notificacaoService = new NotificacaoLembreteService();
