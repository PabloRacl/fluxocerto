export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";
import { startOfMonth, endOfMonth, format } from "date-fns";

function escapeCSV(campo: string): string {
  if (!campo) return '""';
  const precisaAspas = /[",\n\r]/.test(campo);
  if (precisaAspas) {
    return `"${campo.replace(/"/g, '""')}"`;
  }
  return campo;
}

function formatarMoeda(valorEmCentavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

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

    const porCategoria: Record<
      string,
      { name: string; total: number; count: number; type: string }
    > = {};

    transacoes.forEach((t) => {
      const catId = t.categoryId;
      if (!porCategoria[catId]) {
        porCategoria[catId] = {
          name: t.category?.name || "Sem categoria",
          total: 0,
          count: 0,
          type: t.type === "INCOME" ? "Receita" : "Despesa",
        };
      }
      porCategoria[catId].total += t.amount;
      porCategoria[catId].count += 1;
    });

    const totalGeral = transacoes.reduce((sum, t) => sum + t.amount, 0);

    const bom = "\uFEFF";
    const cabecalho = [
      "Categoria",
      "Tipo",
      "Quantidade",
      "Valor Total",
      "% do Total",
    ];

    const linhas = Object.values(porCategoria)
      .sort((a, b) => b.total - a.total)
      .map((cat) => [
        escapeCSV(cat.name),
        cat.type,
        cat.count.toString(),
        formatarMoeda(cat.total),
        totalGeral > 0
          ? ((cat.total / totalGeral) * 100).toFixed(1) + "%"
          : "0%",
      ]);

    linhas.push([]);
    linhas.push([
      "TOTAL",
      "",
      transacoes.length.toString(),
      formatarMoeda(totalGeral),
      "100%",
    ]);

    const nomeArquivo = `categorias_${mes}_${ano}.csv`;
    const conteudoCSV =
      bom + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");

    return new NextResponse(conteudoCSV, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar categorias:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar exportação" },
      { status: 500 },
    );
  }
}
