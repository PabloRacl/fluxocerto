import { prisma } from "@/biblioteca/prisma";
import type { CriarMetaInput } from "@/validacoes/meta.schema";
import { auditService } from "./AuditService";

/**
 * Serviço de Metas — Expandido para Enterprise P10
 */
export class MetaService {
  /**
   * Lista as Metas processando em tempo de execução o progresso e estimativas.
   */
  async listar(usuarioId: string, showDeleted: boolean) {
    const metas = await prisma.meta.findMany({
      where: { usuarioId, isDeleted: false, isArchived: showDeleted },
      include: {
        categoria: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
      orderBy: { criadoEm: "desc" },
    });

    const metasComProjecao = metas.map((meta) => {
      const progresso = meta.valorAlvo > 0
          ? Math.min(100, Math.round((meta.montanteAtual / meta.valorAlvo) * 100))
          : 0;

      const mesesDesdeInicio = Math.max(1, Math.ceil((Date.now() - new Date(meta.criadoEm).getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const mediaMensal = meta.montanteAtual / mesesDesdeInicio;
      const restante = meta.valorAlvo - meta.montanteAtual;
      const mesesParaAtingir = mediaMensal > 0 ? Math.ceil(restante / mediaMensal) : null;

      return { ...meta, progresso, mediaMensal: Math.round(mediaMensal), mesesParaAtingir };
    });

    const counts = await prisma.meta.groupBy({
      by: ["isArchived"],
      where: { usuarioId, isDeleted: false },
      _count: { id: true },
    });

    const totalAtivasCount = counts.find((c) => !c.isArchived)?._count.id || 0;
    const totalExcluidasCount = counts.find((c) => !!c.isArchived)?._count.id || 0;

    const ativas = metasComProjecao.filter((m) => !m.concluida);
    const concluidas = metasComProjecao.filter((m) => m.concluida);
    const totalAlvo = ativas.reduce((acc, m) => acc + m.valorAlvo, 0);
    const totalAtual = ativas.reduce((acc, m) => acc + m.montanteAtual, 0);

    return {
      metas: metasComProjecao,
      resumo: {
        totalMetas: totalAtivasCount,
        totalExcluidas: totalExcluidasCount,
        totalConcluidas: concluidas.length,
        totalAlvo,
        totalAtual,
        progressoGeral: totalAlvo > 0 ? Math.round((totalAtual / totalAlvo) * 100) : 0,
      },
    };
  }

  /**
   * Cria registro da Meta com Auditoria.
   */
  async criar(usuarioId: string, dados: CriarMetaInput) {
    return prisma.$transaction(async (tx) => {
      const meta = await tx.meta.create({
        data: {
          usuarioId,
          nome: dados.nome,
          descricao: dados.descricao || null,
          valorAlvo: dados.valorAlvo,
          montanteAtual: dados.montanteAtual,
          prazo: dados.prazo ? new Date(dados.prazo) : null,
          categoriaId: dados.categoriaId || null,
          icone: dados.icone || null,
          cor: dados.cor,
        },
      });

      await auditService.log({
        userId: usuarioId,
        action: "CREATE_META",
        entityType: "META",
        entityId: meta.id,
        newValue: meta as any,
      });

      return meta;
    });
  }

  /**
   * Realiza um depósito numa meta com Gamificação e Auditoria.
   */
  async depositar(metaId: string, usuarioId: string, valor: number) {
    return prisma.$transaction(async (tx) => {
      const meta = await tx.meta.findFirst({ where: { id: metaId, usuarioId, isDeleted: false } });
      if (!meta) throw new Error("Meta não encontrada");

      const novoMontante = meta.montanteAtual + valor;
      const atingiu = novoMontante >= meta.valorAlvo;

      const updated = await tx.meta.update({
        where: { id: metaId },
        data: {
          montanteAtual: Math.min(novoMontante, meta.valorAlvo),
          concluida: atingiu,
          concluidaEm: atingiu ? new Date() : meta.concluidaEm,
        },
      });

      // --- P9 AUDIT ---
      await auditService.log({
        userId: usuarioId,
        action: "META_DEPOSIT",
        entityType: "META",
        entityId: metaId,
        oldValue: { montanteAnterior: meta.montanteAtual } as any,
        newValue: { valorDepositado: valor, montanteNovo: updated.montanteAtual } as any,
      });

      return { meta: updated, atingiu };
    });
  }
}

export const metaService = new MetaService();
