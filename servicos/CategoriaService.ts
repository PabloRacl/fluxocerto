import { prisma } from "@/biblioteca/prisma";
import type { CriarCategoriaInput } from "@/validacoes/categoria.schema";
import { startOfMonth, endOfMonth } from "date-fns";

/**
 * Serviço de Categorias — Gestão de hierarquia e Orçamentos P12.
 */
export class CategoriaService {
  /**
   * Lista as categorias com base nos filtros e calcula o progresso do orçamento (P12).
   */
  async listar(
    usuarioId: string,
    filtros: { type: string | null; includeInactive: boolean; showArchived: boolean },
  ) {
    const { type, includeInactive, showArchived } = filtros;
    const where: any = {
      userId: usuarioId,
      isDeleted: false, isArchived: showArchived,
    };

    if (!showArchived && !includeInactive) {
      where.isActive = true;
    }

    if (type && ["INCOME", "EXPENSE"].includes(type)) {
      where.type = type;
    }

    const categorias = await (prisma as any).category.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
         _count: { select: { transactions: true } }
      }
    });

    // --- P12 ORÇAMENTOS CONSOLIDADOS ---
    // Calculamos o gasto do mês atual para cada categoria que tem limite
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    const categoriasComOrcamento = await Promise.all(categorias.map(async (cat: any) => {
      if (cat.type === 'EXPENSE' && cat.budgetLimit) {
        const totalGasto = await (prisma as any).transaction.aggregate({
          where: {
            categoryId: cat.id,
            userId: usuarioId,
            type: 'EXPENSE',
            status: 'PAID',
            isDeleted: false,
            occurrenceDate: { gte: inicioMes, lte: fimMes }
          },
          _sum: { amount: true }
        });

        const gastoReal = totalGasto._sum.amount || 0;
        const progressoPerc = Math.round((gastoReal / cat.budgetLimit) * 100);

        return { 
          ...cat, 
          gastoMesAtual: gastoReal, 
          progressoOrcamento: progressoPerc,
          statusOrcamento: progressoPerc >= 100 ? 'ESTOURADO' : progressoPerc >= 80 ? 'ALERTA' : 'OK'
        };
      }
      return { ...cat, gastoMesAtual: 0, progressoOrcamento: 0, statusOrcamento: 'NONE' };
    }));

    return categoriasComOrcamento;
  }

  /**
   * Cria uma nova categoria com budgetLimit opcional.
   */
  async criar(usuarioId: string, dados: any) {
    if (dados.parentId) {
      const parentCategory = await (prisma as any).category.findFirst({
        where: { id: dados.parentId, userId: usuarioId, parentId: null },
      });
      if (!parentCategory) throw new Error("Categoria pai inválida");
    }

    return (prisma as any).category.create({
      data: {
        userId: usuarioId,
        name: dados.name,
        type: dados.type,
        color: dados.color,
        icon: dados.icon || null,
        parentId: dados.parentId || null,
        budgetLimit: dados.budgetLimit ? Math.round(Number(dados.budgetLimit) * 100) : null,
        isActive: true,
      },
    });
  }
}

export const categoriaService = new CategoriaService();
