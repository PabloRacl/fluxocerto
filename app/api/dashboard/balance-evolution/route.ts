import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// ============================================
// GET - Buscar Evolução do Saldo (6 meses)
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
    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");

    // 4. Calcular datas automáticas se não fornecidas (últimos 6 meses)
    const today = new Date();
    
    if (!endDate) {
      endDate = today.toISOString();
    }
    
    if (!startDate) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 5);
      sixMonthsAgo.setDate(1); // Primeiro dia do mês
      startDate = sixMonthsAgo.toISOString();
    }

    // 5. Buscar Transações do Período
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: "PAID", // Apenas transações pagas
        occurrenceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        isDeleted: false,
      },
      select: {
        amount: true,
        type: true,
        occurrenceDate: true,
      },
      orderBy: {
        occurrenceDate: "asc",
      },
    });

    // 6. Agrupar por Mês
    const monthlyData: Record<string, { income: number; expense: number }> = {};

    // Inicializar todos os meses do período
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ajustar para primeiro dia do mês
    start.setDate(1);
    
    for (
      let d = new Date(start.getFullYear(), start.getMonth(), 1);
      d <= end;
      d.setMonth(d.getMonth() + 1)
    ) {
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    // Somar transações por mês
    transactions.forEach((transaction) => {
      const date = new Date(transaction.occurrenceDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (monthlyData[monthKey]) {
        if (transaction.type === "INCOME") {
          monthlyData[monthKey].income += transaction.amount;
        } else {
          monthlyData[monthKey].expense += transaction.amount;
        }
      }
    });

    // 7. Calcular Saldo Acumulado
    let cumulativeBalance = 0;
    const data = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { income, expense }]) => {
        cumulativeBalance += income - expense;
        return {
          month,
          balance: cumulativeBalance,
          income,
          expense,
        };
      });

    // 8. Retornar Resposta
    return NextResponse.json({ 
      data,
      period: {
        startDate,
        endDate,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar evolução do saldo:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar evolução do saldo" },
      { status: 500 }
    );
  }
}