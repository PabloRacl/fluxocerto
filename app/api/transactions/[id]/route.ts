import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// ============================================
// GET - Buscar Transação Específica
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Buscar Usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // 3. Buscar Transação
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        isDeleted: false, // Não mostrar transações excluídas
      },
      include: {
        account: {
          select: { id: true, name: true, color: true, icon: true },
        },
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // 4. Retornar Sucesso
    return NextResponse.json({ transaction }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar transação:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar transação" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Atualizar Transação
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Buscar Usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // 3. Parsear Body
    const body = await request.json();
    const {
      description,
      amount,
      type,
      accountId,
      categoryId,
      occurrenceDate,
      dueDate,
      status,
      notes,
    } = body;

    // 4. Validações Básicas
    if (!description || !amount || !type || !accountId || !categoryId || !occurrenceDate) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valor deve ser um número positivo em centavos" }, { status: 400 });
    }

    // 5. Validar Propriedade da Transação Original
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // 6. Validar Propriedade da Nova Conta e Categoria
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada ou não pertence ao usuário" }, { status: 404 });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada ou não pertence ao usuário" }, { status: 404 });
    }

    // 7. Atualizar Transação e Recalcular Saldo (Transação Atômica)
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // A. Reverter Impacto Antigo no Saldo
      // Se era INCOME, subtrai. Se era EXPENSE, soma (para zerar o impacto anterior)
      const oldBalanceChange = existingTransaction.type === "INCOME" ? existingTransaction.amount : -existingTransaction.amount;
      
      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: {
          balance: {
            increment: -oldBalanceChange, // Inverte o sinal para reverter
          },
        },
      });

      // B. Atualizar os Dados da Transação
      const transaction = await tx.transaction.update({
        where: { id: params.id },
        data: {
          description,
          amount,
          type,
          accountId,
          categoryId,
          occurrenceDate: new Date(occurrenceDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          status,
          notes,
          // Se o status mudou para PAID e antes não era, marca paidAt
          paidAt: status === "PAID" && existingTransaction.status !== "PAID" ? new Date() : existingTransaction.paidAt,
          updatedAt: new Date(),
        },
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      // C. Aplicar Novo Impacto no Saldo
      const newBalanceChange = type === "INCOME" ? amount : -amount;

      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: newBalanceChange,
          },
        },
      });

      return transaction;
    });

    // 8. Retornar Sucesso
    return NextResponse.json(
      {
        message: "Transação atualizada com sucesso",
        transaction: updatedTransaction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar transação" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Arquivar Transação (Soft Delete)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Buscar Usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // 3. Validar Propriedade da Transação
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // 4. Excluir Transação e Reverter Saldo (Transação Atômica)
    const deletedTransaction = await prisma.$transaction(async (tx) => {
      // A. Reverter Impacto no Saldo
      // Se era INCOME, subtrai. Se era EXPENSE, soma.
      const balanceChange = existingTransaction.type === "INCOME" ? existingTransaction.amount : -existingTransaction.amount;

      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: {
          balance: {
            increment: -balanceChange, // Inverte o sinal para remover o impacto
          },
        },
      });

      // B. Marcar como Excluído (Soft Delete)
      const transaction = await tx.transaction.update({
        where: { id: params.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      return transaction;
    });

    // 5. Retornar Sucesso
    return NextResponse.json(
      {
        message: "Transação arquivada com sucesso",
        transaction: deletedTransaction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao arquivar transação:", error);
    return NextResponse.json(
      { error: "Erro interno ao arquivar transação" },
      { status: 500 }
    );
  }
}