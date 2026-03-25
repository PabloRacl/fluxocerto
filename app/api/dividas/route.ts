import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// ============================================
// GET - Listar Dívidas do Usuário
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // ACTIVE, PAID, CANCELLED
    const showDeleted = searchParams.get("showDeleted") === "true";

    const where: any = {
      userId: user.id,
      isDeleted: showDeleted,
    };

    if (status) where.status = status;

    const dividas = await prisma.debt.findMany({
      where,
      include: {
        account: { select: { id: true, name: true, color: true, icon: true } },
        category: { select: { id: true, name: true, color: true, icon: true, type: true } },
      },
      orderBy: { nextDueDate: "asc" },
    });

    // Calcular resumo
    const ativas = dividas.filter((d) => d.status === "ACTIVE");
    const totalEmDividas = ativas.reduce((acc, d) => acc + (d.totalAmount - d.installmentValue * d.installmentPaid), 0);
    const parcelasMensal = ativas.reduce((acc, d) => acc + d.installmentValue, 0);
    const proximoVencimento = ativas.length > 0 ? ativas[0].nextDueDate : null;

    return NextResponse.json({
      dividas,
      resumo: {
        totalEmDividas,
        parcelasMensal,
        proximoVencimento,
        totalAtivas: ativas.length,
        totalQuitadas: dividas.filter((d) => d.isPaidOff).length,
      },
    });
  } catch (error) {
    console.error("Erro ao listar dívidas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ============================================
// POST - Criar Nova Dívida
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      totalAmount,
      installmentValue,
      installmentTotal,
      installmentPaid = 0,
      interestRate,
      amortizationType,
      startDate,
      nextDueDate,
      accountId,
      categoryId,
      creditor,
      allowsPrepayment = true,
    } = body;

    // Validações
    if (!name || !totalAmount || !installmentValue || !installmentTotal || !startDate || !nextDueDate || !accountId || !categoryId) {
      return NextResponse.json({
        error: "Campos obrigatórios: nome, valor total, valor parcela, total parcelas, data início, próximo vencimento, conta e categoria",
      }, { status: 400 });
    }

    // Validar propriedade
    const account = await prisma.account.findFirst({ where: { id: accountId, userId: user.id } });
    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const category = await prisma.category.findFirst({ where: { id: categoryId, userId: user.id } });
    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    // Calcular data final estimada
    const startDateObj = new Date(startDate);
    const mesesRestantes = installmentTotal - installmentPaid;
    const endDate = new Date(startDateObj);
    endDate.setMonth(endDate.getMonth() + mesesRestantes);

    const newDebt = await prisma.debt.create({
      data: {
        userId: user.id,
        accountId,
        categoryId,
        name,
        totalAmount,
        installmentValue,
        installmentTotal,
        installmentPaid,
        interestRate: interestRate || null,
        amortizationType: amortizationType || null,
        allowsPrepayment,
        startDate: new Date(startDate),
        nextDueDate: new Date(nextDueDate),
        endDate,
        status: "ACTIVE",
        creditor: creditor || null,
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: "Dívida criada com sucesso", divida: newDebt }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar dívida:", error);
    return NextResponse.json({ error: "Erro interno ao criar dívida" }, { status: 500 });
  }
}
