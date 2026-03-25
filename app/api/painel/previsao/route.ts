import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export const dynamic = "force-dynamic";

// GET - Previsão de Saldo Futuro
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

    // Saldo atual total (contas ativas, excluindo cartões de crédito)
    const contas = await prisma.account.findMany({
      where: {
        userId: user.id,
        isActive: true,
        isDeleted: false,
        type: { not: "CREDIT_CARD" },
      },
    });

    const saldoAtual = contas.reduce((acc, c) => acc + c.balance, 0);

    // Buscar transações recorrentes
    const recorrentes = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
        isRecurring: true,
      },
      orderBy: { occurrenceDate: "desc" },
    });

    // Buscar assinaturas ativas
    const assinaturas = await prisma.assinatura.findMany({
      where: {
        usuarioId: user.id,
        ativa: true,
        excluida: false,
      },
    });

    // Buscar dívidas ativas
    const dividas = await prisma.debt.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
        isPaidOff: false,
      },
    });

    // Calcular previsão para os próximos 6 meses
    const agora = new Date();
    const previsao: {
      mes: string;
      saldo: number;
      receitas: number;
      despesas: number;
    }[] = [];
    let saldoProjetado = saldoAtual;

    for (let i = 0; i < 6; i++) {
      const mesReferencia = new Date(
        agora.getFullYear(),
        agora.getMonth() + i + 1,
        0,
      );
      const mesLabel = mesReferencia.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      let receitasMes = 0;
      let despesasMes = 0;

      // Calcular receitas/despesas recorrentes do mês
      for (const r of recorrentes) {
        const valor = r.type === "INCOME" ? r.amount : -r.amount;
        if (r.type === "INCOME") receitasMes += r.amount;
        else despesasMes += r.amount;
      }

      // Assinaturas (converter para mensal)
      for (const a of assinaturas) {
        let valorMensal = a.valor;
        switch (a.ciclo) {
          case "SEMANAL":
            valorMensal = a.valor * 4;
            break;
          case "QUINZENAL":
            valorMensal = a.valor * 2;
            break;
          case "BIMESTRAL":
            valorMensal = Math.round(a.valor / 2);
            break;
          case "TRIMESTRAL":
            valorMensal = Math.round(a.valor / 3);
            break;
          case "SEMESTRAL":
            valorMensal = Math.round(a.valor / 6);
            break;
          case "ANUAL":
            valorMensal = Math.round(a.valor / 12);
            break;
        }
        despesasMes += valorMensal;
      }

      // Parcelas de dívidas
      for (const d of dividas) {
        if (d.installmentPaid < d.installmentTotal) {
          despesasMes += d.installmentValue;
        }
      }

      saldoProjetado = saldoProjetado + receitasMes - despesasMes;

      previsao.push({
        mes: mesLabel,
        saldo: saldoProjetado,
        receitas: receitasMes,
        despesas: despesasMes,
      });
    }

    // Verificar se algum mês ficará negativo
    const mesNegativo = previsao.find((p) => p.saldo < 0);

    return NextResponse.json({
      saldoAtual,
      previsao,
      alerta: mesNegativo
        ? `Atenção: saldo projetado negativo em ${mesNegativo.mes}`
        : null,
      resumo: {
        mediaReceitas: previsao.length > 0 ? previsao[0].receitas : 0,
        mediaDespesas: previsao.length > 0 ? previsao[0].despesas : 0,
        saldoMensal:
          previsao.length > 0 ? previsao[0].receitas - previsao[0].despesas : 0,
      },
    });
  } catch (error) {
    console.error("Erro ao calcular previsão:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
