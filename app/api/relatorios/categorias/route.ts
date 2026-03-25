export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const mes = parseInt(searchParams.get("month") || "0");
    const ano = parseInt(searchParams.get("year") || "0");
    const tipo = searchParams.get("type") || "EXPENSE";

    if (!mes || !ano) {
      return NextResponse.json(
        { error: "Mês e ano são obrigatórios" },
        { status: 400 },
      );
    }

    const dataInicio = startOfMonth(new Date(ano, mes - 1, 1));
    const dataFim = endOfMonth(new Date(ano, mes - 1, 1));

    const where: any = {
      userId: usuario.id,
      status: "PAID",
      isDeleted: false,
      occurrenceDate: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (tipo && tipo !== "ALL") {
      where.type = tipo;
    }

    const transacoes = await prisma.transaction.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, type: true, color: true } },
      },
    });

    const totalGeral = transacoes.reduce((sum, t) => sum + t.amount, 0);

    const porCategoria: Record<
      string,
      {
        categoryId: string;
        name: string;
        total: number;
        count: number;
        color: string;
      }
    > = {};

    transacoes.forEach((t) => {
      const catId = t.categoryId;
      if (!porCategoria[catId]) {
        porCategoria[catId] = {
          categoryId: catId,
          name: t.category?.name || "Sem categoria",
          total: 0,
          count: 0,
          color: t.category?.color || "#047857",
        };
      }
      porCategoria[catId].total += t.amount;
      porCategoria[catId].count += 1;
    });

    const categories = Object.values(porCategoria).sort(
      (a, b) => b.total - a.total,
    );

    return NextResponse.json({
      categories,
      summary: {
        total: totalGeral,
        count: transacoes.length,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório por categoria:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar relatório" },
      { status: 500 },
    );
  }
}
