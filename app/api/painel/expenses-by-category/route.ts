import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// ============================================
// GET - Buscar Despesas por Categoria
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
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 3. Parsear Query Params
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Datas de início e fim são obrigatórias" },
        { status: 400 },
      );
    }

    // 4. Buscar Transações de Despesas do Período
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE", // Apenas despesas
        status: "PAID", // Apenas transações pagas
        occurrenceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        isDeleted: false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // 5. Agrupar por Categoria
    const categoryTotals: Record<
      string,
      { name: string; color: string; total: number }
    > = {};

    transactions.forEach((transaction) => {
      const categoryId = transaction.categoryId;

      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = {
          name: transaction.category.name,
          color: transaction.category.color || "#047857",
          total: 0,
        };
      }

      categoryTotals[categoryId].total += transaction.amount;
    });

    // 6. Calcular Total Geral
    const grandTotal = Object.values(categoryTotals).reduce(
      (sum, cat) => sum + cat.total,
      0,
    );

    // 7. Transformar em Array e Calcular Percentual
    const data = Object.entries(categoryTotals)
      .map(([categoryId, { name, color, total }]) => ({
        categoryId,
        categoryName: name,
        categoryColor: color,
        totalAmount: total,
        percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount); // Ordenar por maior valor

    // 8. Retornar Resposta
    return NextResponse.json({ data, grandTotal }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar despesas por categoria:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar despesas por categoria" },
      { status: 500 },
    );
  }
}
