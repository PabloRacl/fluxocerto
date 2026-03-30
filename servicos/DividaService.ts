import { prisma } from "@/biblioteca/prisma";
import type { CriarDividaInput } from "@/validacoes/divida.schema";
import { auditService } from "./AuditService";

/**
 * Serviço de Dívidas — encapsula toda a lógica de negócio
 * relacionada a dívidas parceladas.
 */
export class DividaService {
  /**
   * Lista dívidas do usuário com resumo financeiro.
   */
  async listar(
    usuarioId: string,
    filtros: { status?: string | null; showDeleted: boolean },
  ) {
    const where: any = {
      userId: usuarioId,
      isDeleted: false,
      isArchived: filtros.showDeleted,
    };

    if (filtros.status) where.status = filtros.status;

    const dividas = await prisma.debt.findMany({
      where,
      include: {
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
      orderBy: { nextDueDate: "asc" },
    });

    // Calcular resumo (apenas para dívidas não arquivadas se não estiver na lixeira)
    const ativas = dividas.filter((d) => d.status === "ACTIVE" && !d.isArchived);
    const totalEmDividas = ativas.reduce(
      (acc, d) =>
        acc + (d.totalAmount - d.installmentValue * d.installmentPaid),
      0,
    );
    const parcelasMensal = ativas.reduce(
      (acc, d) => acc + d.installmentValue,
      0,
    );
    const proximoVencimento =
      ativas.length > 0 ? ativas[0].nextDueDate : null;

    const counts = await prisma.debt.groupBy({
      by: ["isArchived"],
      where: { userId: usuarioId, isDeleted: false },
      _count: { id: true },
    });

    const totalAtivasCount = counts.find((c) => !c.isArchived)?._count.id || 0;
    const totalExcluidasCount = counts.find((c) => !!c.isArchived)?._count.id || 0;

    return {
      dividas,
      resumo: {
        totalEmDividas,
        parcelasMensal,
        proximoVencimento,
        totalAtivas: totalAtivasCount,
        totalExcluidas: totalExcluidasCount,
        totalQuitadas: dividas.filter((d) => d.isPaidOff).length,
      },
    };
  }

  /**
   * Cria uma nova dívida, validando propriedade da conta e categoria.
   */
  async criar(usuarioId: string, dados: CriarDividaInput) {
    // Validar propriedade da conta
    const account = await prisma.account.findFirst({
      where: { id: dados.accountId, userId: usuarioId },
    });
    if (!account) {
      throw new Error("Conta não encontrada");
    }

    // Validar propriedade da categoria
    const category = await prisma.category.findFirst({
      where: { id: dados.categoryId, userId: usuarioId },
    });
    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    // Calcular data final estimada
    const startDateObj = new Date(dados.startDate);
    const mesesRestantes = dados.installmentTotal - dados.installmentPaid;
    const endDate = new Date(startDateObj);
    endDate.setMonth(endDate.getMonth() + mesesRestantes);

    return prisma.$transaction(async (tx) => {
      const divida = await tx.debt.create({
        data: {
          userId: usuarioId,
          accountId: dados.accountId,
          categoryId: dados.categoryId,
          name: dados.name,
          totalAmount: dados.totalAmount,
          installmentValue: dados.installmentValue,
          installmentTotal: dados.installmentTotal,
          installmentPaid: dados.installmentPaid,
          interestRate: dados.interestRate != null ? dados.interestRate : null,
          amortizationType: dados.amortizationType ?? null,
          allowsPrepayment: dados.allowsPrepayment,
          startDate: new Date(dados.startDate),
          nextDueDate: new Date(dados.nextDueDate),
          endDate,
          status: "ACTIVE",
          creditor: dados.creditor || null,
        },
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      // --- LOGICA P27: SINCRONIZAÇÃO DE SALDO ---
      if (dados.installmentPaid > 0) {
        const valorJaPago = dados.installmentPaid * dados.installmentValue;

        // Gerar uma transação "acumulada" para o histórico ou múltiplas? 
        // Vamos gerar uma única transação de ajuste para manter o histórico limpo mas o saldo correto.
        await tx.transaction.create({
          data: {
            userId: usuarioId,
            accountId: dados.accountId,
            categoryId: dados.categoryId,
            description: `Parcelas pagas ant. (${dados.installmentPaid}): ${dados.name}`,
            amount: valorJaPago,
            type: "EXPENSE",
            status: "PAID",
            occurrenceDate: new Date(dados.startDate),
            paidAt: new Date(dados.startDate),
            notes: "Ajuste automático de parcelas já quitadas na criação da dívida (P27)",
          }
        });

        // Atualizar saldo da conta
        await tx.account.update({
          where: { id: dados.accountId },
          data: { balance: { decrement: valorJaPago } }
        });
      }

      await auditService.log({
        userId: usuarioId,
        action: "CREATE_DEBT",
        entityType: "DEBT",
        entityId: divida.id,
        newValue: divida,
      });

      return divida;
    });
  }
  /**
   * Registra o pagamento de uma ou mais parcelas de uma dívida.
   * Cria transações reais e abate do saldo da conta vinculada.
   */
  async registrarPagamento(
    usuarioId: string,
    dividaId: string,
    dados: { tipo: "PAGAR_PARCELA" | "ANTECIPAR"; quantidadeParcelas: number; valorPago?: number }
  ) {
    const { tipo, quantidadeParcelas, valorPago } = dados;

    const [debt, user] = await Promise.all([
      prisma.debt.findUnique({ where: { id: dividaId } }),
      prisma.user.findFirst({ where: { id: usuarioId } })
    ]);

    if (!debt || debt.userId !== usuarioId) {
      throw new Error("Dívida não encontrada");
    }

    const valorUnitario = debt.installmentValue;
    const totalAPagar = valorPago || (valorUnitario * quantidadeParcelas);
    const novasPagas = debt.installmentPaid + quantidadeParcelas;
    const quitada = novasPagas >= debt.installmentTotal;

    // Calcular próximo vencimento
    const proximoVencimento = new Date(debt.nextDueDate);
    proximoVencimento.setMonth(proximoVencimento.getMonth() + quantidadeParcelas);

    // Calcular economia se antecipação
    let economia = 0;
    if (tipo === "ANTECIPAR" && debt.interestRate) {
      const taxaMensal = Number(debt.interestRate) / 100;
      const saldoRestante = debt.totalAmount - (valorUnitario * debt.installmentPaid);
      economia = Math.round(saldoRestante * taxaMensal * quantidadeParcelas);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Atualizar a dívida
      const updatedDebt = await tx.debt.update({
        where: { id: dividaId },
        data: {
          installmentPaid: novasPagas,
          isPaidOff: quitada,
          paidOffAt: quitada ? new Date() : null,
          status: quitada ? "PAID" : "ACTIVE",
          nextDueDate: quitada ? debt.nextDueDate : proximoVencimento,
        },
      });

      // 2. Criar Transação de Despesa (PAGAMENTO)
      await tx.transaction.create({
        data: {
          userId: usuarioId,
          accountId: debt.accountId,
          categoryId: debt.categoryId,
          description: `${tipo === "ANTECIPAR" ? "Antecipação" : "Pagamento"} ${quantidadeParcelas}x: ${debt.name}`,
          amount: totalAPagar,
          type: "EXPENSE",
          status: "PAID",
          occurrenceDate: new Date(),
          paidAt: new Date(),
          notes: `Pagamento de parcela(s) via módulo de dívidas. Dívida: ${debt.name}`,
        }
      });

      // 3. Atualizar saldo da conta
      await tx.account.update({
        where: { id: debt.accountId },
        data: { balance: { decrement: totalAPagar } }
      });

      await auditService.log({
        userId: usuarioId,
        action: "PAY_DEBT_INSTALLMENT",
        entityType: "DEBT",
        entityId: dividaId,
        newValue: {
          tipo,
          quantidadeParcelas,
          valorPago: totalAPagar,
          divida: updatedDebt
        },
      });

      return {
        divida: updatedDebt,
        economia,
        quitada,
        valorPago: totalAPagar
      };
    });
  }
}


/** Instância singleton do serviço */
export const dividaService = new DividaService();
