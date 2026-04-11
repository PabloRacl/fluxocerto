import { prisma } from "@/biblioteca/prisma";
import type { CriarTransacaoInput } from "@/validacoes/transacao.schema";
import { auditService } from "./AuditService";
import { revalidarCacheDashboard } from "@/biblioteca/cache-revalidation";

/**
 * Filtros de listagem de transações.
 */
interface FiltrosTransacao {
  page: number;
  limit: number;
  type?: string | null;
  accountId?: string | null;
  categoryId?: string | null;
  status?: string | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  showArchived: boolean;
}

/**
 * Serviço de Transações — encapsula toda a lógica de negócio
 * relacionada a transações financeiras.
 */
export class TransacaoService {
  /**
   * Lista transações do usuário com filtros e paginação.
   */
  async listar(usuarioId: string, filtros: FiltrosTransacao) {
    const { page, limit, type, accountId, categoryId, status, search, startDate, endDate, showArchived } = filtros;

    const whereClause: any = {
      userId: usuarioId,
      isDeleted: false,
      isArchived: showArchived,
    };

    if (type) whereClause.type = type;
    if (accountId) whereClause.accountId = accountId;
    if (categoryId) whereClause.categoryId = categoryId;
    if (status) whereClause.status = status;
    if (search) {
      whereClause.description = {
        contains: search,
        mode: "insensitive",
      };
    }
    if (startDate || endDate) {
      whereClause.occurrenceDate = {};
      if (startDate) whereClause.occurrenceDate.gte = new Date(startDate);
      if (endDate) whereClause.occurrenceDate.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        select: {
          id: true,
          description: true,
          amount: true,
          type: true,
          status: true,
          occurrenceDate: true,
          dueDate: true,
          paidAt: true,
          notes: true,
          isRecurring: true,
          isInstallment: true,
          installmentTotal: true,
          installmentCurrent: true,
          accountId: true,
          categoryId: true,
          isReconciled: true,
          reconciledAt: true,
          isArchived: true,
          archivedAt: true,
          createdAt: true,
          updatedAt: true,
          account: {
            select: { id: true, name: true, color: true, icon: true },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
              type: true,
            },
          },
        },
        orderBy: { occurrenceDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    const counts = await prisma.transaction.groupBy({
      by: ["isArchived"],
      where: { userId: usuarioId, isDeleted: false },
      _count: { id: true },
    });

    const totalActiveCount = counts.find((c) => !c.isArchived)?._count.id || 0;
    const totalArchivedCount = counts.find((c) => !!c.isArchived)?._count.id || 0;

    return {
      transactions: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        totalActive: totalActiveCount,
        totalArchived: totalArchivedCount,
      },
    };
  }

  /**
   * Cria uma nova transação com atualização atômica de saldo e auditoria.
   */
  async criar(usuarioId: string, dados: CriarTransacaoInput) {
    const account = await prisma.conta.findFirst({
      where: { id: dados.accountId, userId: usuarioId },
    });
    if (!account) {
      throw new Error("Conta não encontrada ou não pertence ao usuário");
    }

    const category = await prisma.category.findFirst({
      where: { id: dados.categoryId, userId: usuarioId },
    });
    if (!category) {
      throw new Error("Categoria não encontrada ou não pertence ao usuário");
    }

    const newTransaction = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: usuarioId,
          accountId: dados.accountId,
          categoryId: dados.categoryId,
          description: dados.description,
          amount: dados.amount,
          type: dados.type,
          status: dados.status,
          occurrenceDate: new Date(dados.occurrenceDate),
          dueDate: dados.dueDate ? new Date(dados.dueDate) : null,
          paidAt: dados.status === "PAID" ? new Date() : null,
          notes: dados.notes || null,
          isRecurring: dados.isRecurring,
          recurrenceType: dados.recurrenceType || null,
          recurrenceDay: dados.recurrenceDay || null,
          isInstallment: dados.isInstallment,
          installmentTotal: dados.installmentTotal || null,
          installmentCurrent: dados.installmentCurrent || null,
          installmentId: dados.installmentId || null,
          isDeleted: false,
        },
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      // --- P9 AUDIT LOG ---
      await auditService.log({
        userId: usuarioId,
        action: "CREATE_TRANSACTION",
        entityType: "TRANSACTION",
        entityId: transaction.id,
        newValue: transaction,
      });

      const balanceChange = dados.type === "INCOME" ? dados.amount : -dados.amount;

      await tx.conta.update({
        where: { id: dados.accountId },
        data: {
          balance: { increment: balanceChange },
        },
      });

      return transaction;
    });

    try {
      await revalidarCacheDashboard(usuarioId);
    } catch (e) {
      console.warn("revalidateTag failed ou rodando via worker", e);
    }

    return newTransaction;
  }
}

export const transacaoService = new TransacaoService();
