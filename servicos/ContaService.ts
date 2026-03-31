import { prisma } from "@/biblioteca/prisma";
import type { CriarContaInput } from "@/validacoes/conta.schema";

/**
 * Serviço de Contas — Encapsula a lógica de negócio
 * para gestão de contas e carteiras do usuário.
 */
export class ContaService {
  /**
   * Lista todas as contas do usuário com as formatações
   * e contagens (transactions count).
   */
  async listar(usuarioId: string, includeArchived: boolean) {
    const whereClause: any = {
      userId: usuarioId,
      isDeleted: false,
      isArchived: includeArchived,
    };

    const accounts = await prisma.conta.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        color: true,
        icon: true,
        isActive: true,
        isArchived: true,
        diaFechamento: true,
        diaVencimento: true,
        limiteCredito: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Formata o saldo para o frontend
    return accounts.map((acc) => ({
      ...acc,
      balanceFormatted: acc.balance / 100,
    }));
  }

  /**
   * Cria uma nova conta.
   */
  async criar(usuarioId: string, dados: CriarContaInput) {
    const newAccount = await prisma.conta.create({
      data: {
        userId: usuarioId,
        name: dados.name,
        type: dados.type,
        balance: dados.balance || 0,
        color: dados.color,
        icon: dados.icon || null,
        isActive: true,
      },
    });

    return {
      ...newAccount,
      balanceFormatted: newAccount.balance / 100,
    };
  }
}

export const contaService = new ContaService();
