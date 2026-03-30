import { prisma } from "@/biblioteca/prisma";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { insightService } from "./InsightService";
import { painelService } from "./PainelService";

export class RelatorioService {
  /**
   * Resolve e padroniza as datas de busca (Prioridade: custom -> preset -> mes/ano).
   */
  private resolverPeriodo(params: {
    dataInicioParam?: string | null;
    dataFimParam?: string | null;
    periodoParam?: string | null;
    mesParam?: string | null;
    anoParam?: string | null;
  }) {
    const agora = new Date();
    let dataInicio: Date;
    let dataFim: Date;
    let nomePeriodo = "";

    if (params.dataInicioParam && params.dataFimParam) {
      dataInicio = new Date(params.dataInicioParam);
      dataFim = new Date(params.dataFimParam);
      nomePeriodo = `${format(dataInicio, "dd/MM/yyyy")} a ${format(dataFim, "dd/MM/yyyy")}`;
    } else if (params.periodoParam) {
      switch (params.periodoParam) {
        case "ULTIMOS_3_MESES":
          dataInicio = startOfMonth(subMonths(agora, 2));
          dataFim = endOfMonth(agora);
          nomePeriodo = "Últimos 3 Meses";
          break;
        case "SEMESTRAL":
          dataInicio = startOfMonth(subMonths(agora, 5));
          dataFim = endOfMonth(agora);
          nomePeriodo = "Últimos 6 Meses";
          break;
        case "ANUAL":
          dataInicio = startOfYear(agora);
          dataFim = endOfYear(agora);
          nomePeriodo = `Ano ${agora.getFullYear()}`;
          break;
        default:
          dataInicio = startOfMonth(agora);
          dataFim = endOfMonth(agora);
          nomePeriodo = format(agora, "MMMM yyyy", { locale: ptBR });
      }
    } else if (params.mesParam && params.anoParam) {
      const mes = parseInt(params.mesParam);
      const ano = parseInt(params.anoParam);
      dataInicio = new Date(ano, mes - 1, 1);
      dataFim = new Date(ano, mes, 0);
      nomePeriodo = format(dataInicio, "MMMM yyyy", { locale: ptBR });
    } else {
      dataInicio = startOfMonth(agora);
      dataFim = endOfMonth(agora);
      nomePeriodo = format(agora, "MMMM yyyy", { locale: ptBR });
    }

    return { dataInicio, dataFim, nomePeriodo };
  }

  /**
   * Obtém os dados completos do Dashboard Mensal / Customizado.
   */
  async obterMensal(usuarioId: string, params: any) {
    const { dataInicio, dataFim, nomePeriodo } = this.resolverPeriodo(params);

    const whereTransacao: any = {
      userId: usuarioId,
      status: "PAID",
      isDeleted: false, isArchived: false,
      occurrenceDate: { gte: dataInicio, lte: dataFim },
    };

    if (params.tipoParam && params.tipoParam !== "ALL") whereTransacao.type = params.tipoParam;
    if (params.contaIdParam) whereTransacao.accountId = params.contaIdParam;
    if (params.categoriaIdParam) whereTransacao.categoryId = params.categoriaIdParam;

    const transacoes = await prisma.transaction.findMany({
      where: whereTransacao,
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true, color: true } },
      },
      orderBy: { occurrenceDate: "asc" }
    });

    const totalReceitas = transacoes.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const totalDespesas = transacoes.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const saldo = totalReceitas - totalDespesas;

    const porCategoria: Record<string, any> = {};
    const porDia: Record<string, { receitas: number; despesas: number }> = {};

    const mes = dataInicio.getMonth() + 1;
    const ano = dataInicio.getFullYear();

    for (let d = 1; d <= dataFim.getDate(); d++) {
      const diaKey = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      porDia[diaKey] = { receitas: 0, despesas: 0 };
    }

    transacoes.forEach((t) => {
      const catId = t.categoryId;
      if (!porCategoria[catId]) {
        porCategoria[catId] = {
          nome: t.category.name,
          total: 0,quantidade: 0,
          tipo: t.category.type,
          cor: t.category.color || "#047857",
        };
      }
      porCategoria[catId].total += t.amount;
      porCategoria[catId].quantidade += 1;

      const diaKey = new Date(t.occurrenceDate).toISOString().split("T")[0];
      if (porDia[diaKey]) {
        if (t.type === "INCOME") porDia[diaKey].receitas += t.amount;
        else porDia[diaKey].despesas += t.amount;
      }
    });

    const diferencaMeses = (dataFim.getFullYear() - dataInicio.getFullYear()) * 12 + (dataFim.getMonth() - dataInicio.getMonth());
    const mesAnteriorData = subMonths(dataInicio, diferencaMeses + 1);
    const mesAnteriorFim = startOfMonth(dataInicio);

    const whereMesAnterior = { ...whereTransacao, occurrenceDate: { gte: mesAnteriorData, lte: mesAnteriorFim } };
    const transacoesMesAnterior = await prisma.transaction.findMany({ where: whereMesAnterior });

    const receitasAnterior = transacoesMesAnterior.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const despesasAnterior = transacoesMesAnterior.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const saldoAnterior = receitasAnterior - despesasAnterior;

    const variacaoReceitas = receitasAnterior > 0 ? ((totalReceitas - receitasAnterior) / receitasAnterior) * 100 : 0;
    const variacaoDespesas = despesasAnterior > 0 ? ((totalDespesas - despesasAnterior) / despesasAnterior) * 100 : 0;
    const variacaoSaldo = saldoAnterior !== 0 ? ((saldo - saldoAnterior) / Math.abs(saldoAnterior)) * 100 : 0;

    const topCategorias = Object.entries(porCategoria)
      .filter(([_, dados]) => dados.tipo === "EXPENSE")
      .map(([id, dados]) => ({ categoriaId: id, ...dados as any }))
      .sort((a, b) => b.total - a.total).slice(0, 5);

    const agora = new Date();
    const ehMesAtual = ano === agora.getFullYear() && mes === agora.getMonth() + 1;
    let projecao = null;

    if (ehMesAtual) {
      const diasNoMes = dataFim.getDate();
      const diasPassados = agora.getDate();
      const diasRestantes = diasNoMes - diasPassados;
      const mediaDiariaDespesas = diasPassados > 0 ? Math.round(totalDespesas / diasPassados) : 0;
      const despesaEstimadaFim = totalDespesas + mediaDiariaDespesas * diasRestantes;
      const saldoEstimadoFim = totalReceitas - despesaEstimadaFim;

      projecao = { diasRestantes, mediaDiariaDespesas, despesaEstimadaFim, saldoEstimadoFim };
    }

    return {
      periodo: {
        mes, ano,
        nomeMes: nomePeriodo,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
      },
      resumo: { totalReceitas, totalDespesas, saldo, quantidadeTransacoes: transacoes.length },
      comparativo: { mesAnterior: { receitas: receitasAnterior, despesas: despesasAnterior, saldo: saldoAnterior }, variacaoReceitas, variacaoDespesas, variacaoSaldo },
      porCategoria: Object.entries(porCategoria).map(([id, dados]) => ({ categoriaId: id, ...dados as any })),
      porDia: Object.entries(porDia).map(([dia, dados]) => ({ dia, ...dados })),
      topCategorias, projecao, transacoes,
      // --- P8 ENTERPRISE DATA ---
      saude: await insightService.calcularSaudeFinanceira(usuarioId),
      patrimonio: await painelService.obterPatrimonio(usuarioId),
    };
  }

  /**
   * Obtém cruamente as transações formatadas para PDF/Exports.
   */
  async obterTransacoesParaExportacao(usuarioId: string, params: any) {
    const { dataInicio, dataFim, nomePeriodo } = this.resolverPeriodo(params);

    const where: any = {
      userId: usuarioId,
      status: "PAID",
      isDeleted: false, isArchived: false,
      occurrenceDate: { gte: dataInicio, lte: dataFim },
    };
    if (params.tipoParam && params.tipoParam !== "ALL") where.type = params.tipoParam;
    if (params.contaIdParam) where.accountId = params.contaIdParam;
    if (params.categoriaIdParam) where.categoryId = params.categoriaIdParam;

    const transacoes = await prisma.transaction.findMany({
      where,
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
      orderBy: { occurrenceDate: "asc" },
    });

    const saude = await insightService.calcularSaudeFinanceira(usuarioId);
    const patrimonio = await painelService.obterPatrimonio(usuarioId);

    return { transacoes, nomePeriodo, dataInicio, dataFim, saude, patrimonio };
  }

  /**
   * Gera a string CSV formatada de transações.
   */
  async exportarCSVTransacoes(usuarioId: string, params: any) {
    const { transacoes, nomePeriodo } = await this.obterTransacoesParaExportacao(usuarioId, params);

    const totalReceitas = transacoes.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const totalDespesas = transacoes.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const saldo = totalReceitas - totalDespesas;

    const bom = "\uFEFF";
    const cabecalho = ["Data", "Descrição", "Categoria", "Tipo", "Conta", "Status", "Valor", "Observações"];

    const escapeCSV = (campo: string) => /[",\n\r]/.test(campo) ? `"${campo.replace(/"/g, '""')}"` : campo;
    const formatarMoeda = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);

    const linhas = transacoes.map((t) => [
      format(new Date(t.occurrenceDate), "dd/MM/yyyy"),
      escapeCSV(t.description),
      escapeCSV(t.category?.name || "Sem categoria"),
      t.type === "INCOME" ? "Receita" : "Despesa",
      escapeCSV(t.account?.name || "Sem conta"),
      t.status === "PAID" ? "Pago" : "Pendente",
      formatarMoeda(t.amount),
      escapeCSV(t.notes || ""),
    ]);

    linhas.push([], ["RESUMO DO PERÍODO", "", "", "", "", "", "", ""]);
    linhas.push(["Total Receitas", "", "", "", "", "", formatarMoeda(totalReceitas), ""]);
    linhas.push(["Total Despesas", "", "", "", "", "", formatarMoeda(totalDespesas), ""]);
    linhas.push(["Saldo", "", "", "", "", "", formatarMoeda(saldo), ""]);
    linhas.push(["Período", "", "", "", "", "", nomePeriodo, ""]);
    linhas.push(["Total Transações", "", "", "", "", "", transacoes.length.toString(), ""]);

    return {
      conteudoCSV: bom + [cabecalho.join(";"), ...linhas.map((linha) => linha.join(";"))].join("\n"),
      nomePeriodo
    };
  }

  /**
   * Gera a string CSV formatada por categoria.
   */
  async exportarCSVCategorias(usuarioId: string, params: any) {
    const { dataInicio, dataFim } = this.resolverPeriodo({ mesParam: params.mes, anoParam: params.ano });

    const where: any = {
      userId: usuarioId,
      status: "PAID",
      isDeleted: false, isArchived: false,
      occurrenceDate: { gte: dataInicio, lte: dataFim },
    };
    if (params.tipo && params.tipo !== "ALL") where.type = params.tipo;

    const transacoes = await prisma.transaction.findMany({
      where,
      include: { category: { select: { id: true, name: true, type: true, color: true } } },
    });

    const porCategoria: Record<string, any> = {};
    transacoes.forEach((t) => {
      const catId = t.categoryId;
      if (!porCategoria[catId]) {
        porCategoria[catId] = {
          name: t.category?.name || "Sem categoria",
          total: 0, count: 0,
          type: t.type === "INCOME" ? "Receita" : "Despesa",
        };
      }
      porCategoria[catId].total += t.amount;
      porCategoria[catId].count += 1;
    });

    const totalGeral = transacoes.reduce((sum, t) => sum + t.amount, 0);
    const bom = "\uFEFF";
    const cabecalho = ["Categoria", "Tipo", "Quantidade", "Valor Total", "% do Total"];
    
    const escapeCSV = (campo: string) => /[",\n\r]/.test(campo) ? `"${campo.replace(/"/g, '""')}"` : campo;
    const formatarMoeda = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);

    const linhas = Object.values(porCategoria)
      .sort((a, b) => b.total - a.total)
      .map((cat) => [
        escapeCSV(cat.name),
        cat.type,
        cat.count.toString(),
        formatarMoeda(cat.total),
        totalGeral > 0 ? ((cat.total / totalGeral) * 100).toFixed(1) + "%" : "0%",
      ]);

    linhas.push([], ["TOTAL", "", transacoes.length.toString(), formatarMoeda(totalGeral), "100%"]);

    return bom + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
  }

  /**
   * Obtém histórico.
   */
  async obterHistorico(usuarioId: string) {
    return prisma.reportHistory.findMany({
      where: { userId: usuarioId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const relatorioService = new RelatorioService();
