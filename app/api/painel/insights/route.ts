import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// GET - Insights e Análises Automáticas
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

    const agora = new Date();
    const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioMesAnterior = new Date(
      agora.getFullYear(),
      agora.getMonth() - 1,
      1,
    );
    const fimMesAnterior = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      0,
      23,
      59,
      59,
    );
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - 7);

    const insights: {
      tipo: "positivo" | "alerta" | "info" | "dica";
      titulo: string;
      descricao: string;
      icone: string;
    }[] = [];

    // 1. Comparação com mês anterior
    const despesasMesAtual = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        isDeleted: false,
        status: "PAID",
        occurrenceDate: { gte: inicioMesAtual },
      },
      _sum: { amount: true },
    });

    const despesasMesAnterior = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        isDeleted: false,
        status: "PAID",
        occurrenceDate: { gte: inicioMesAnterior, lte: fimMesAnterior },
      },
      _sum: { amount: true },
    });

    const atual = despesasMesAtual._sum.amount || 0;
    const anterior = despesasMesAnterior._sum.amount || 0;

    if (anterior > 0) {
      const variacao = Math.round(((atual - anterior) / anterior) * 100);
      if (variacao > 20) {
        insights.push({
          tipo: "alerta",
          titulo: "Gastos aumentaram significativamente",
          descricao: `Você gastou ${variacao}% a mais que no mês passado até agora. Revise seus gastos recentes.`,
          icone: "📈",
        });
      } else if (variacao < -10) {
        insights.push({
          tipo: "positivo",
          titulo: "Parabéns! Gastos reduzidos",
          descricao: `Você gastou ${Math.abs(variacao)}% a menos que no mês passado. Continue assim!`,
          icone: "📉",
        });
      }
    }

    // 2. Maior categoria de despesa
    const topCategoria = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: user.id,
        type: "EXPENSE",
        isDeleted: false,
        status: "PAID",
        occurrenceDate: { gte: inicioMesAtual },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 1,
    });

    if (topCategoria.length > 0 && atual > 0) {
      const cat = await prisma.category.findUnique({
        where: { id: topCategoria[0].categoryId },
      });
      if (cat) {
        const percentual = Math.round(
          (topCategoria[0]._sum.amount! / atual) * 100,
        );
        insights.push({
          tipo: "info",
          titulo: `Maior despesa: ${cat.name}`,
          descricao: `${cat.name} representa ${percentual}% dos seus gastos este mês (${formatCurrency(topCategoria[0]._sum.amount!)})`,
          icone: cat.icon || "📊",
        });
      }
    }

    // 3. Dias sem registrar gastos
    const ultimaTransacao = await prisma.transaction.findFirst({
      where: { userId: user.id, isDeleted: false },
      orderBy: { occurrenceDate: "desc" },
    });

    if (ultimaTransacao) {
      const diasSemRegistro = Math.floor(
        (agora.getTime() - ultimaTransacao.occurrenceDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (diasSemRegistro > 3) {
        insights.push({
          tipo: "dica",
          titulo: `${diasSemRegistro} dias sem registrar`,
          descricao:
            "Mantenha o controle registrando suas transações regularmente. Quanto mais dados, melhores decisões!",
          icone: "📝",
        });
      }
    }

    // 4. Economia potencial com assinaturas
    const assinaturas = await prisma.assinatura.findMany({
      where: { usuarioId: user.id, ativa: true, excluida: false },
    });

    if (assinaturas.length > 2) {
      const totalMensal = assinaturas.reduce((acc, a) => {
        switch (a.ciclo) {
          case "SEMANAL":
            return acc + a.valor * 4;
          case "QUINZENAL":
            return acc + a.valor * 2;
          case "MENSAL":
            return acc + a.valor;
          case "BIMESTRAL":
            return acc + Math.round(a.valor / 2);
          case "TRIMESTRAL":
            return acc + Math.round(a.valor / 3);
          case "SEMESTRAL":
            return acc + Math.round(a.valor / 6);
          case "ANUAL":
            return acc + Math.round(a.valor / 12);
          default:
            return acc + a.valor;
        }
      }, 0);

      insights.push({
        tipo: "info",
        titulo: `${assinaturas.length} assinaturas ativas`,
        descricao: `Você gasta ${formatCurrency(totalMensal)}/mês (${formatCurrency(totalMensal * 12)}/ano) com assinaturas. Considere revisar as que não usa.`,
        icone: "🔄",
      });
    }

    // 5. Meta mais próxima de atingir
    const metas = await prisma.meta.findMany({
      where: { usuarioId: user.id, excluida: false, concluida: false },
      orderBy: { montanteAtual: "desc" },
      take: 1,
    });

    if (metas.length > 0) {
      const meta = metas[0];
      const progresso = Math.round((meta.montanteAtual / meta.valorAlvo) * 100);
      if (progresso >= 50) {
        insights.push({
          tipo: "positivo",
          titulo: `"${meta.nome}" em ${progresso}%`,
          descricao: `Faltam apenas ${formatCurrency(meta.valorAlvo - meta.montanteAtual)} para atingir sua meta!`,
          icone: "🎯",
        });
      }
    }

    // 6. Dívidas com parcelas próximas do fim
    const dividas = await prisma.debt.findMany({
      where: { userId: user.id, isDeleted: false, isPaidOff: false },
    });

    for (const d of dividas) {
      const restantes = d.installmentTotal - d.installmentPaid;
      if (restantes <= 3 && restantes > 0) {
        insights.push({
          tipo: "positivo",
          titulo: `"${d.name}" quase quitada!`,
          descricao: `Faltam apenas ${restantes} parcela(s). Continue firme!`,
          icone: "🏆",
        });
      }
    }

    // 7. Projeção de economia semanal
    const despesasSemana = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        isDeleted: false,
        status: "PAID",
        occurrenceDate: { gte: inicioSemana },
      },
      _sum: { amount: true },
    });

    const gastoSemana = despesasSemana._sum.amount || 0;
    if (gastoSemana > 0) {
      const economia = Math.round(gastoSemana * 0.1);
      insights.push({
        tipo: "dica",
        titulo: "Dica de economia",
        descricao: `Se economizar 10% dos seus gastos semanais (~${formatCurrency(economia)}/semana), terá ${formatCurrency(economia * 52)} a mais no ano.`,
        icone: "💡",
      });
    }

    // 8. Limite de cartão
    const cartoes = await prisma.account.findMany({
      where: {
        userId: user.id,
        type: "CREDIT_CARD",
        isActive: true,
        isDeleted: false,
        limiteCredito: { gt: 0 },
      },
    });

    for (const cartao of cartoes) {
      const total = await prisma.transaction.aggregate({
        where: { userId: user.id, accountId: cartao.id, isDeleted: false },
        _sum: { amount: true },
      });

      const usado = total._sum.amount || 0;
      const percentual = Math.round((usado / cartao.limiteCredito!) * 100);

      if (percentual >= 90) {
        insights.push({
          tipo: "alerta",
          titulo: `Cartão ${cartao.name}: ${percentual}% usado`,
          descricao: `Cuidado! Seu cartão está quase no limite. Disponível: ${formatCurrency(cartao.limiteCredito! - usado)}`,
          icone: "⚠️",
        });
      }
    }

    return NextResponse.json({ insights, geradoEm: agora.toISOString() });
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v / 100);
}
