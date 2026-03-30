import { prisma } from "@/biblioteca/prisma";
import type { CriarAssinaturaInput } from "@/validacoes/assinatura.schema";
import { auditService } from "./AuditService";

/**
 * Serviço de Assinaturas — Consolidado P12
 */
export class AssinaturaService {
  /**
   * Lista assinaturas e projeta impacto mensal proativo.
   */
  async listar(usuarioId: string, filtros: any) {
    const { showDeleted, ativa } = filtros;
    const where: any = { usuarioId, isDeleted: false, isArchived: showDeleted };

    if (ativa !== null && ativa !== undefined && !showDeleted) {
      where.ativa = ativa === "true";
    }

    const assinaturas = await prisma.assinatura.findMany({
      where,
      include: {
        categoria: { select: { id: true, name: true, color: true } },
        conta: { select: { id: true, name: true, color: true, icon: true } },
      },
      orderBy: { proximaRenovacao: "asc" },
    });

    const ativas = assinaturas.filter((a) => a.ativa && !a.isArchived);
    const valorMensal = ativas.reduce((acc: number, a) => {
      const v = a.valor;
      switch (a.ciclo) {
        case "SEMANAL": return acc + v * 4;
        case "QUINZENAL": return acc + v * 2;
        case "MENSAL": return acc + v;
        case "BIMESTRAL": return acc + Math.round(v / 2);
        case "TRIMESTRAL": return acc + Math.round(v / 3);
        case "SEMESTRAL": return acc + Math.round(v / 6);
        case "ANUAL": return acc + Math.round(v / 12);
        default: return acc + v;
      }
    }, 0);

    const counts = await prisma.assinatura.groupBy({
      by: ["isArchived"],
      where: { usuarioId, isDeleted: false },
      _count: { id: true },
    });

    const totalAtivasCount = counts.find((c) => !c.isArchived)?._count.id || 0;
    const totalExcluidasCount = counts.find((c) => !!c.isArchived)?._count.id || 0;

    return {
      assinaturas,
      resumo: {
        totalAtivas: totalAtivasCount,
        totalExcluidas: totalExcluidasCount,
        valorMensal,
        valorAnual: valorMensal * 12,
      },
    };
  }

  /**
   * Cria uma assinatura e gera a PRIMEIRA transação correspondente (Fim da redundância P12).
   */
  async criar(usuarioId: string, dados: CriarAssinaturaInput) {
    return prisma.$transaction(async (tx) => {
      const valorCentavos = Math.round(dados.valor * 100);
      
      const assinatura = await tx.assinatura.create({
        data: {
          usuarioId,
          nome: dados.nome,
          descricao: dados.descricao || null,
          valor: valorCentavos,
          ciclo: dados.ciclo as any,
          proximaRenovacao: new Date(dados.proximaRenovacao),
          categoriaId: dados.categoriaId || null,
          contaId: dados.contaId || null,
        },
      });

      // --- LOGICA P12: UNIFICAÇÃO ---
      // Ao criar uma assinatura, geramos uma transação real de despesa e atualizamos o saldo
      if (dados.contaId && dados.categoriaId) {
        await tx.transaction.create({
          data: {
            userId: usuarioId,
            accountId: dados.contaId,
            categoryId: dados.categoriaId,
            description: `Assinatura: ${dados.nome}`,
            amount: valorCentavos,
            type: "EXPENSE",
            status: "PAID",
            occurrenceDate: new Date(),
            paidAt: new Date(),
            notes: "Gerado automaticamente via Módulo de Assinaturas (P12)",
          }
        });

        await tx.account.update({
          where: { id: dados.contaId },
          data: { balance: { decrement: valorCentavos } }
        });
      }

      await auditService.log({
        userId: usuarioId,
        action: "CREATE_SUBSCRIPTION",
        entityType: "ASSINATURA",
        entityId: assinatura.id,
        newValue: assinatura as any,
      });

      return assinatura;
    });
  }
}

export const assinaturaService = new AssinaturaService();
