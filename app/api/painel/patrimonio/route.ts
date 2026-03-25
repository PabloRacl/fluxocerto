import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// GET - Patrimônio do Usuário (Ativos - Passivos)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    // ATIVOS (contas com saldo positivo, excluindo cartões de crédito)
    const contasAtivas = await prisma.account.findMany({
      where: {
        userId: user.id,
        isActive: true,
        isDeleted: false,
        type: { not: "CREDIT_CARD" },
      },
      orderBy: { balance: "desc" },
    });

    // Agrupar por tipo de conta
    const ativos: Record<
      string,
      { tipo: string; contas: any[]; total: number }
    > = {
      CHECKING: { tipo: "Conta Corrente", contas: [], total: 0 },
      SAVINGS: { tipo: "Poupança", contas: [], total: 0 },
      INVESTMENT: { tipo: "Investimentos", contas: [], total: 0 },
      CASH: { tipo: "Dinheiro", contas: [], total: 0 },
      PIX: { tipo: "PIX", contas: [], total: 0 },
      OTHER: { tipo: "Outros", contas: [], total: 0 },
    };

    for (const conta of contasAtivas) {
      const key = conta.type;
      if (ativos[key]) {
        ativos[key].contas.push({
          id: conta.id,
          name: conta.name,
          balance: conta.balance,
          color: conta.color,
          icon: conta.icon,
        });
        ativos[key].total += conta.balance;
      }
    }

    // Filtrar tipos com contas
    const ativosFiltrados = Object.values(ativos).filter(
      (a) => a.contas.length > 0,
    );
    const totalAtivos = ativosFiltrados.reduce((acc, a) => acc + a.total, 0);

    // PASSIVOS (dívidas ativas)
    const dividas = await prisma.debt.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
        isPaidOff: false,
      },
    });

    const totalDividas = dividas.reduce((acc, d) => {
      const restante =
        (d.installmentTotal - d.installmentPaid) * d.installmentValue;
      return acc + restante;
    }, 0);

    // Faturas de cartão pendentes
    const cartoes = await prisma.account.findMany({
      where: {
        userId: user.id,
        type: "CREDIT_CARD",
        isActive: true,
        isDeleted: false,
      },
    });

    let totalFaturas = 0;
    for (const cartao of cartoes) {
      const faturaAtual = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          accountId: cartao.id,
          isDeleted: false,
        },
        _sum: { amount: true },
      });
      totalFaturas += faturaAtual._sum.amount || 0;
    }

    const totalPassivos = totalDividas + totalFaturas;
    const patrimonioLiquido = totalAtivos - totalPassivos;

    // Percentuais de composição
    const composicao = ativosFiltrados.map((a) => ({
      tipo: a.tipo,
      valor: a.total,
      percentual:
        totalAtivos > 0 ? Math.round((a.total / totalAtivos) * 100) : 0,
    }));

    return NextResponse.json({
      ativos: ativosFiltrados,
      totalAtivos,
      passivos: {
        dividas: {
          total: totalDividas,
          quantidade: dividas.length,
        },
        faturasCartao: {
          total: totalFaturas,
          quantidade: cartoes.length,
        },
        total: totalPassivos,
      },
      patrimonioLiquido,
      composicao,
    });
  } catch (error) {
    console.error("Erro ao calcular patrimônio:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
