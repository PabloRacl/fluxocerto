export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 3. Parsear Query Params
    const searchParams = request.nextUrl.searchParams;
    const mesParam = searchParams.get("mes");
    const anoParam = searchParams.get("ano");
    const tipoParam = searchParams.get("tipo");
    const contaIdParam = searchParams.get("contaId");
    const categoriaIdParam = searchParams.get("categoriaId");
    const dataInicioParam = searchParams.get("dataInicio");
    const dataFimParam = searchParams.get("dataFim");
    const periodoParam = searchParams.get("periodo");

    const agora = new Date();
    let dataInicio: Date;
    let dataFim: Date;
    let nomePeriodo: string = "";

    // 4. Calcular Período (prioridade: data customizada > preset > mês/ano)
    if (dataInicioParam && dataFimParam) {
      dataInicio = new Date(dataInicioParam);
      dataFim = new Date(dataFimParam);
      nomePeriodo = `${format(dataInicio, "dd/MM/yyyy")} a ${format(dataFim, "dd/MM/yyyy")}`;
    } else if (periodoParam) {
      switch (periodoParam) {
        case "ULTIMOS_3_MESES":
          dataInicio = startOfMonth(subMonths(agora, 2));
          dataFim = endOfMonth(agora);
          break;
        case "SEMESTRAL":
          dataInicio = startOfMonth(subMonths(agora, 5));
          dataFim = endOfMonth(agora);
          break;
        case "ANUAL":
          dataInicio = new Date(agora.getFullYear(), 0, 1);
          dataFim = new Date(agora.getFullYear(), 11, 31);
          break;
        default:
          dataInicio = startOfMonth(agora);
          dataFim = endOfMonth(agora);
      }
    } else if (mesParam && anoParam) {
      const mes = parseInt(mesParam);
      const ano = parseInt(anoParam);
      dataInicio = new Date(ano, mes - 1, 1);
      dataFim = new Date(ano, mes, 0);
    } else {
      dataInicio = startOfMonth(agora);
      dataFim = endOfMonth(agora);
    }

    // Set fallback pra response de periodo:
    const mes = dataInicio.getMonth() + 1;
    const ano = dataInicio.getFullYear();

    // 5. Montar where e Buscar Transações
    const whereTransacao: any = {
      userId: usuario.id,
      status: "PAID",
      isDeleted: false,
      occurrenceDate: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (tipoParam && tipoParam !== "ALL") whereTransacao.type = tipoParam;
    if (contaIdParam) whereTransacao.accountId = contaIdParam;
    if (categoriaIdParam) whereTransacao.categoryId = categoriaIdParam;

    const transacoes = await prisma.transaction.findMany({
      where: whereTransacao,
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true, color: true } },
      },
    });

    // 6. Calcular Resumo
    const totalReceitas = transacoes
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDespesas = transacoes
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const saldo = totalReceitas - totalDespesas;

    // 7. Agrupar por Categoria
    const porCategoria: Record<
      string,
      {
        nome: string;
        total: number;
        quantidade: number;
        tipo: string;
        cor: string;
      }
    > = {};
    transacoes.forEach((t) => {
      const catId = t.categoryId;
      if (!porCategoria[catId]) {
        porCategoria[catId] = {
          nome: t.category.name,
          total: 0,
          quantidade: 0,
          tipo: t.category.type,
          cor: t.category.color || "#047857",
        };
      }
      porCategoria[catId].total += t.amount;
      porCategoria[catId].quantidade += 1;
    });

    // 8. Agrupar por Dia (para gráfico de linha)
    const porDia: Record<string, { receitas: number; despesas: number }> = {};
    for (let d = 1; d <= dataFim.getDate(); d++) {
      const diaKey = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      porDia[diaKey] = { receitas: 0, despesas: 0 };
    }
    transacoes.forEach((t) => {
      const diaKey = new Date(t.occurrenceDate).toISOString().split("T")[0];
      if (porDia[diaKey]) {
        if (t.type === "INCOME") {
          porDia[diaKey].receitas += t.amount;
        } else {
          porDia[diaKey].despesas += t.amount;
        }
      }
    });

    // 9. Buscar Mês Anterior para Comparativo com herança de filtros de Transacao
    const diferencaMeses =
      (dataFim.getFullYear() - dataInicio.getFullYear()) * 12 +
      (dataFim.getMonth() - dataInicio.getMonth());
    const mesAnteriorData = subMonths(dataInicio, diferencaMeses + 1);
    const mesAnteriorFim = startOfMonth(dataInicio); // Até o dia anterior do Start Date atual

    const whereMesAnterior = {
      ...whereTransacao,
      occurrenceDate: { gte: mesAnteriorData, lte: mesAnteriorFim },
    };

    const transacoesMesAnterior = await prisma.transaction.findMany({
      where: whereMesAnterior,
    });
    const receitasAnterior = transacoesMesAnterior
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const despesasAnterior = transacoesMesAnterior
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    const saldoAnterior = receitasAnterior - despesasAnterior;

    // 10. Calcular Variação Percentual
    const variacaoReceitas =
      receitasAnterior > 0
        ? ((totalReceitas - receitasAnterior) / receitasAnterior) * 100
        : 0;
    const variacaoDespesas =
      despesasAnterior > 0
        ? ((totalDespesas - despesasAnterior) / despesasAnterior) * 100
        : 0;
    const variacaoSaldo =
      saldoAnterior !== 0
        ? ((saldo - saldoAnterior) / Math.abs(saldoAnterior)) * 100
        : 0;

    // 11. Top Categorias de Despesas (Apenas EXPENSE)
    const topCategorias = Object.entries(porCategoria)
      .filter(([_, dados]) => dados.tipo === "EXPENSE")
      .map(([id, dados]) => ({
        categoriaId: id,
        nome: dados.nome,
        total: dados.total,
        quantidade: dados.quantidade,
        cor: dados.cor,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 12. Projeção para fim do mês (Apenas se for mês atual)
    const ehMesAtual =
      ano === agora.getFullYear() && mes === agora.getMonth() + 1;
    let projecao = null;

    if (ehMesAtual) {
      const diasNoMes = dataFim.getDate();
      const diasPassados = agora.getDate();
      const diasRestantes = diasNoMes - diasPassados;
      const mediaDiariaDespesas =
        diasPassados > 0 ? Math.round(totalDespesas / diasPassados) : 0;
      const despesaEstimadaFim =
        totalDespesas + mediaDiariaDespesas * diasRestantes;
      const saldoEstimadoFim = totalReceitas - despesaEstimadaFim;

      projecao = {
        diasRestantes,
        mediaDiariaDespesas,
        despesaEstimadaFim,
        saldoEstimadoFim,
      };
    }

    // 13. Retornar Resposta
    return NextResponse.json({
      periodo: {
        mes,
        ano,
        nomeMes: nomePeriodo || format(dataInicio, "MMMM", { locale: ptBR }),
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
      },
      resumo: {
        totalReceitas,
        totalDespesas,
        saldo,
        quantidadeTransacoes: transacoes.length,
      },
      comparativo: {
        mesAnterior: {
          receitas: receitasAnterior,
          despesas: despesasAnterior,
          saldo: saldoAnterior,
        },
        variacaoReceitas,
        variacaoDespesas,
        variacaoSaldo,
      },
      porCategoria: Object.entries(porCategoria).map(([id, dados]) => ({
        categoriaId: id,
        ...dados,
      })),
      porDia: Object.entries(porDia).map(([dia, dados]) => ({
        dia,
        ...dados,
      })),
      topCategorias,
      projecao,
      transacoes,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório mensal:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar relatório" },
      { status: 500 },
    );
  }
}
