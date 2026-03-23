import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// ============================================
// GET - Relatório Mensal Completo
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

    // 3. Parsear Query Params
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    // 4. Calcular Período
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 5. Buscar Transações do Período
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: "PAID",
        isDeleted: false,
        occurrenceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
    });

    // 6. Calcular Resumo
    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // 7. Agrupar por Categoria
    const byCategory: Record<string, { name: string; total: number; count: number }> = {};
    transactions.forEach((t) => {
      const catId = t.categoryId;
      if (!byCategory[catId]) {
        byCategory[catId] = {
          name: t.category.name,
          total: 0,
          count: 0,
        };
      }
      byCategory[catId].total += t.amount;
      byCategory[catId].count += 1;
    });

    // 8. Agrupar por Dia (para gráfico de linha)
    const byDay: Record<string, { income: number; expense: number }> = {};
    for (let d = 1; d <= endDate.getDate(); d++) {
      const dayKey = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      byDay[dayKey] = { income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const dayKey = new Date(t.occurrenceDate).toISOString().split("T")[0];
      if (byDay[dayKey]) {
        if (t.type === "INCOME") {
          byDay[dayKey].income += t.amount;
        } else {
          byDay[dayKey].expense += t.amount;
        }
      }
    });

    // 9. Buscar Mês Anterior para Comparativo
    const prevMonthDate = new Date(year, month - 2, 1);
    const prevMonthEnd = new Date(year, month - 1, 0);
    const prevTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: "PAID",
        isDeleted: false,
        occurrenceDate: {
          gte: prevMonthDate,
          lte: prevMonthEnd,
        },
      },
    });
    const prevIncome = prevTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const prevExpense = prevTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    // 10. Calcular Variação Percentual
    const incomeVariation = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseVariation = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;

    // 11. Top Categorias de Despesas
    const topCategories = Object.entries(byCategory)
      .filter(([_, data]) => transactions.find((t) => t.categoryId === _ && t.type === "EXPENSE"))
      .map(([id, data]) => ({
        categoryId: id,
        name: data.name,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 12. Retornar Resposta
    return NextResponse.json({
      period: {
        month,
        year,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length,
      },
      comparison: {
        prevMonth: {
          income: prevIncome,
          expense: prevExpense,
        },
        incomeVariation,
        expenseVariation,
      },
      byCategory: Object.entries(byCategory).map(([id, data]) => ({
        categoryId: id,
        ...data,
      })),
      byDay: Object.entries(byDay).map(([day, data]) => ({
        day,
        ...data,
      })),
      topCategories,
      transactions,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório mensal:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar relatório" },
      { status: 500 }
    );
  }
}