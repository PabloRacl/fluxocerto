import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// ============================================
// GET - Listar Transações do Usuário
// ============================================
export async function GET(request: NextRequest) {
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

    // 3. Parsear Query Params (Filtros e Paginação)
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const type = searchParams.get("type"); // INCOME ou EXPENSE
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status"); // PENDING, PAID, CANCELLED
    const search = searchParams.get("search"); // Busca por descrição
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 4. Construir Filtros
    const whereClause: any = {
      userId: user.id,
      isDeleted: false, // Soft delete: não mostra transações excluídas
    };

    if (type) whereClause.type = type;
    if (accountId) whereClause.accountId = accountId;
    if (categoryId) whereClause.categoryId = categoryId;
    if (status) whereClause.status = status;
    if (search) {
      whereClause.description = {
        contains: search,
        mode: "insensitive", // Busca case-insensitive
      };
    }
    if (startDate || endDate) {
      whereClause.occurrenceDate = {};
      if (startDate) whereClause.occurrenceDate.gte = new Date(startDate);
      if (endDate) whereClause.occurrenceDate.lte = new Date(endDate);
    }

    // 5. Buscar Transações com Paginação
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          account: {
            select: { id: true, name: true, color: true, icon: true },
          },
          category: {
            select: { id: true, name: true, color: true, icon: true, type: true },
          },
        },
        orderBy: { occurrenceDate: "desc" }, // Mais recentes primeiro
        skip,
        take: limit,
      }),
      prisma.transaction.count({
        where: whereClause,
      }),
    ]);

    // 6. Retornar Resposta
    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar transações:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar transações" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Criar Nova Transação
// ============================================
export async function POST(request: NextRequest) {
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
      status = "PAID", // Padrão: Pago
      notes,
      isRecurring = false,
      recurrenceType,
      recurrenceDay,
      isInstallment = false,
      installmentTotal,
      installmentCurrent,
      installmentId,
    } = body;

    // 4. Validações Básicas
    if (!description || !amount || !type || !accountId || !categoryId || !occurrenceDate) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando (description, amount, type, accountId, categoryId, occurrenceDate)" },
        { status: 400 }
      );
    }

    // Validação de Tipo
    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido (use INCOME ou EXPENSE)" }, { status: 400 });
    }

    // Validação de Valor (deve ser inteiro positivo em centavos)
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valor deve ser um número positivo em centavos" }, { status: 400 });
    }

    // 5. Validar Propriedade da Conta e Categoria (Segurança)
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

    // 6. Criar Transação e Atualizar Saldo (Transação Atômica)
    // GARANTIA DE INTEGRIDADE: Ou os dois ocorrem, ou nenhum
    const newTransaction = await prisma.$transaction(async (tx) => {
      // A. Criar a Transação
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          accountId,
          categoryId,
          description,
          amount,
          type,
          status,
          occurrenceDate: new Date(occurrenceDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          paidAt: status === "PAID" ? new Date() : null,
          notes,
          isRecurring,
          recurrenceType,
          recurrenceDay,
          isInstallment,
          installmentTotal,
          installmentCurrent,
          installmentId,
          isDeleted: false,
        },
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      // B. Atualizar Saldo da Conta
      // Regra: INCOME soma, EXPENSE subtrai
      const balanceChange = type === "INCOME" ? amount : -amount;
      
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      return transaction;
    });

    // 7. Retornar Sucesso
    return NextResponse.json(
      {
        message: "Transação criada com sucesso",
        transaction: newTransaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar transação" },
      { status: 500 }
    );
  }
}