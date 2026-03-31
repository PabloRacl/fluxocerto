import { prisma } from "@/biblioteca/prisma";
import { insightService } from "./InsightService";

export class PainelService {
  /**
   * Obtém saldo total das contas e receitas/despesas fechadas do mês atual
   */
  async obterResumoRapido(usuarioId: string) {
    const contas = await prisma.conta.findMany({
      where: {
        userId: usuarioId,
        isActive: true,
        isDeleted: false,
        isArchived: false,
      },
      select: { balance: true },
    });

    let totalBalance =
      contas.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

    // Datas do mês atual em UTC para evitar discrepâncias de fuso horário
    const agora = new Date();
    const dataInicio = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1));
    const dataFimExclusivo = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + 1, 1));

    console.log(`[PainelService] Buscando transações entre ${dataInicio.toISOString()} e ${dataFimExclusivo.toISOString()}`);

    const transacoesMes = await prisma.transaction.findMany({
      where: {
        userId: usuarioId,
        isDeleted: false,
        isArchived: false,
        status: "PAID",
        occurrenceDate: { gte: dataInicio, lt: dataFimExclusivo },
      },
      select: { amount: true, type: true },
    });

    console.log(`[PainelService] Encontradas ${transacoesMes.length} transações para o mês.`);

    const totalIncome =
      transacoesMes
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const totalExpense =
      transacoesMes
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const monthlyBalance = totalIncome - totalExpense;

    // Fallback: se saldos das contas não estiverem sincronizados, calcula por transações pagas (all-time)
    // Isso evita o dashboard ficar zerado mesmo quando existem transações.
    if (totalBalance === 0) {
      const [incomeAgg, expenseAgg] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId: usuarioId,
            status: "PAID",
            type: "INCOME",
            isDeleted: false,
            isArchived: false,
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId: usuarioId,
            status: "PAID",
            type: "EXPENSE",
            isDeleted: false,
            isArchived: false,
          },
          _sum: { amount: true },
        }),
      ]);

      totalBalance = (incomeAgg._sum.amount || 0) - (expenseAgg._sum.amount || 0);
    }

    // --- P4 INTEGRATION: ASSETS/PATRIMONIO ---
    // Mantém o resumo resiliente caso o módulo de ativos não esteja disponível no banco atual.
    let assets: Array<{ valorAtual: number }> = [];
    try {
      assets = await (prisma as any).asset.findMany({
        where: { usuarioId, isDeleted: false, isArchived: false },
        select: { valorAtual: true }
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Falha ao consultar ativos no resumo:", error);
      }
    }
    const totalAssets = assets.reduce((sum: number, a: { valorAtual: number }) => sum + (a.valorAtual || 0), 0) || 0;
    const netWorth = (totalBalance + totalAssets) || 0;

    // --- P5 INTEGRATION: HEALTH SCORE ---
    // Não derruba os cards principais se o motor de insights falhar.
    let saude = { score: 0, status: "INDISPONIVEL" as string };
    try {
      const resultadoSaude = await insightService.calcularSaudeFinanceira(usuarioId);
      saude = {
        score: resultadoSaude?.score ?? 0,
        status: resultadoSaude?.status ?? "INDISPONIVEL",
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Falha ao calcular saúde financeira no resumo:", error);
      }
    }

    return { 
      totalBalance, 
      totalIncome, 
      totalExpense, 
      monthlyBalance, 
      totalAssets,
      netWorth,
      healthScore: saude.score,
      healthStatus: saude.status,
      accountCount: contas.length,
      assetCount: assets.length 
    };
  }

  /**
   * Calcula níveis, XPs, badges de progresso e streaks.
   */
  async obterGamificacao(usuarioId: string) {
    const agora = new Date();

    const totalTransacoes = await prisma.transaction.count({
      where: { userId: usuarioId, isDeleted: false, isArchived: false },
    });

    const totalContas = await prisma.conta.count({
      where: { userId: usuarioId, isActive: true, isDeleted: false, isArchived: false },
    });

    const totalCategorias = await prisma.category.count({
      where: { userId: usuarioId, isActive: true, isArchived: false },
    });

    const resumoRapido = await this.obterResumoRapido(usuarioId);

    const metasConcluidas = await prisma.meta.count({
      where: { usuarioId: usuarioId, concluida: true, isDeleted: false, isArchived: false },
    });

    const dividasQuitadas = await prisma.debt.count({
      where: { userId: usuarioId, isPaidOff: true, isDeleted: false, isArchived: false },
    });

    const totalAssets = await (prisma as any).asset.count({
      where: { usuarioId, isDeleted: false, isArchived: false }
    });
    
    const assetsSum = await (prisma as any).asset.aggregate({
      where: { usuarioId, isDeleted: false, isArchived: false },
      _sum: { valorAtual: true }
    });

    // Calcular streak (dias consecutivos com transações)
    const transacoesRecentes = await prisma.transaction.findMany({
      where: { userId: usuarioId, isDeleted: false, isArchived: false },
      orderBy: { occurrenceDate: "desc" },
      select: { occurrenceDate: true },
      take: 90,
    });

    const diasUnicos = [
      ...new Set(
        transacoesRecentes.map(
          (t) => t.occurrenceDate.toISOString().split("T")[0],
        ),
      ),
    ]
      .sort()
      .reverse();
    let streak = 0;
    let dataVerificacao = new Date(agora);

    for (const dia of diasUnicos) {
      const dataDia = new Date(dia);
      const diffDias = Math.floor(
        (dataVerificacao.getTime() - dataDia.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDias <= 1) {
        streak++;
        dataVerificacao = dataDia;
      } else {
        break;
      }
    }

    const metasSum = await prisma.meta.aggregate({
      where: { usuarioId: usuarioId, isDeleted: false, isArchived: false },
      _sum: { montanteAtual: true }
    });

    // --- P5 & P4 BONUSES ---
    const bonusSaude = (resumoRapido.healthScore || 0) * 2; // +2 XP por ponto de saúde
    
    // XP Progressivo: 
    // +10 por transação, +100 por meta concluída, +50 por dívida quitada
    // +20 por conta, +30 por ativo, +10 por R$ 1.000 em ativos
    // +10 por R$ 100 guardados em METAS (Incentivo à poupança)
    const xp =
      totalTransacoes * 10 +
      metasConcluidas * 100 +
      dividasQuitadas * 50 +
      totalContas * 20 +
      totalAssets * 30 +
      Math.floor((assetsSum._sum.valorAtual || 0) / 100000) * 10 + 
      Math.floor((metasSum._sum.montanteAtual || 0) / 10000) * 10 + 
      bonusSaude +
      streak * 5;
    const nivel = Math.floor(xp / 200) + 1;
    const xpNecessario = nivel * 200;
    const xpAtual = xp % 200;
    const progressoNivel = Math.round((xpAtual / 200) * 100);

    const NIVEIS: Record<number, { nome: string; icone: string }> = {
      1: { nome: "Iniciante", icone: "🌱" },
      2: { nome: "Organizado", icone: "📋" },
      3: { nome: "Financeiro", icone: "💰" },
      4: { nome: "Economizador", icone: "🏦" },
      5: { nome: "Investidor", icone: "📈" },
      6: { nome: "Expert", icone: "🏆" },
      7: { nome: "Mestre", icone: "👑" },
      8: { nome: "Lenda", icone: "⭐" },
    };

    const nivelInfo = NIVEIS[Math.min(nivel, 8)] || NIVEIS[8];

    // Array estático de Badges
    const badges = [
      {
        id: "primeira_transacao",
        nome: "Primeiro Passo",
        descricao: "Registre sua primeira transação",
        icone: "🎯",
        conquistado: totalTransacoes >= 1,
        progresso: Math.min(100, totalTransacoes * 100),
      },
      {
        id: "organizador",
        nome: "Organizador",
        descricao: "Cadastre 3 ou mais contas",
        icone: "📁",
        conquistado: totalContas >= 3,
        progresso: Math.min(100, Math.round((totalContas / 3) * 100)),
      },
      {
        id: "categorizador",
        nome: "Categorizador",
        descricao: "Crie 5 categorias personalizadas",
        icone: "🏷️",
        conquistado: totalCategorias >= 5,
        progresso: Math.min(100, Math.round((totalCategorias / 5) * 100)),
      },
      {
        id: "meta_atingida",
        nome: "Meta Batida",
        descricao: "Conclua sua primeira meta",
        icone: "🏆",
        conquistado: metasConcluidas >= 1,
        progresso: metasConcluidas >= 1 ? 100 : 0,
      },
      {
        id: "sem_dividas",
        nome: "Livre de Dívidas",
        descricao: "Quite sua primeira dívida",
        icone: "🎉",
        conquistado: dividasQuitadas >= 1,
        progresso: dividasQuitadas >= 1 ? 100 : 0,
      },
      {
        id: "streak_7",
        nome: "Consistente",
        descricao: "Registre transações por 7 dias seguidos",
        icone: "🔥",
        conquistado: streak >= 7,
        progresso: Math.min(100, Math.round((streak / 7) * 100)),
      },
      {
        id: "streak_30",
        nome: "Dedicado",
        descricao: "Registre transações por 30 dias seguidos",
        icone: "⚡",
        conquistado: streak >= 30,
        progresso: Math.min(100, Math.round((streak / 30) * 100)),
      },
      {
        id: "patriarca",
        nome: "Patrimônio",
        descricao: "Cadastre seu primeiro ativo físico ou investimento",
        icone: "🏠",
        conquistado: totalAssets >= 1,
        progresso: totalAssets >= 1 ? 100 : 0,
      },
      {
        id: "saude_pro",
        nome: "Saúde Pro",
        descricao: "Mantenha um Health Score acima de 80",
        icone: "🛡️",
        conquistado: (resumoRapido.healthScore || 0) >= 80,
        progresso: Math.min(100, (resumoRapido.healthScore || 0)),
      },
      // --- EXPANSÃO RPG: TIERS 2 & 3 ---
      {
        id: "cacador_notas",
        nome: "Caçador de Notas",
        descricao: "Registre 50 transações no sistema",
        icone: "💸",
        conquistado: totalTransacoes >= 50,
        progresso: Math.min(100, Math.round((totalTransacoes / 50) * 100)),
      },
      {
        id: "magnata_planilhas",
        nome: "Magnata das Planilhas",
        descricao: "Registre 200 transações no sistema",
        icone: "👑",
        conquistado: totalTransacoes >= 200,
        progresso: Math.min(100, Math.round((totalTransacoes / 200) * 100)),
      },
      {
        id: "mestre_construtor",
        nome: "Mestre Construtor",
        descricao: "Atingiu e concluiu 3 Metas Financeiras",
        icone: "🏗️",
        conquistado: metasConcluidas >= 3,
        progresso: Math.min(100, Math.round((metasConcluidas / 3) * 100)),
      },
      {
        id: "investidor_nato",
        nome: "Investidor Nato",
        descricao: "Acumule R$ 10.000 em Patrimônio/Ativos",
        icone: "💎",
        conquistado: (assetsSum._sum.valorAtual || 0) >= 1000000,
        progresso: Math.min(100, Math.round(((assetsSum._sum.valorAtual || 0) / 1000000) * 100)),
      },
      {
        id: "zero_inadimplencia",
        nome: "Zero Inadimplência",
        descricao: "Quite 3 Dívidas ou Financiamentos",
        icone: "⚔️",
        conquistado: dividasQuitadas >= 3,
        progresso: Math.min(100, Math.round((dividasQuitadas / 3) * 100)),
      },
      {
        id: "saude_elite",
        nome: "Saúde Elite",
        descricao: "Mantenha o Health Score perfeito (95+)",
        icone: "🌟",
        conquistado: (resumoRapido.healthScore || 0) >= 95,
        progresso: Math.min(100, Math.round(((resumoRapido.healthScore || 0) / 95) * 100)),
      },
    ];

    return {
      nivel: {
        nivel,
        nome: nivelInfo.nome,
        icone: nivelInfo.icone,
        xp,
        xpNecessario,
        xpAtual,
        progressoNivel,
      },
      streak,
      badges,
      resumo: {
        totalBadges: badges.length,
        badgesConquistados: badges.filter((b) => b.conquistado).length,
        totalTransacoes,
        metasConcluidas,
        dividasQuitadas,
      },
    };
  }

  /**
   * Calcula o Patrimônio Líquido (Ativos X Passivos).
   */
  async obterPatrimonio(usuarioId: string) {
    const contasAtivas = await prisma.conta.findMany({
      where: {
        userId: usuarioId,
        isActive: true,
        isDeleted: false, isArchived: false,
        type: { not: "CREDIT_CARD" },
      },
      orderBy: { balance: "desc" },
    });

    const ativos: Record<string, { tipo: string; contas: any[]; total: number }> = {
      CHECKING: { tipo: "Conta Corrente", contas: [], total: 0 },
      SAVINGS: { tipo: "Poupança", contas: [], total: 0 },
      INVESTMENT: { tipo: "Investimentos", contas: [], total: 0 },
      CASH: { tipo: "Dinheiro", contas: [], total: 0 },
      PIX: { tipo: "PIX", contas: [], total: 0 },
      OTHER: { tipo: "Outros", contas: [], total: 0 },
    };

    for (const conta of contasAtivas) {
      if (ativos[conta.type]) {
        ativos[conta.type].contas.push({
          id: conta.id,
          name: conta.name,
          balance: conta.balance,
          color: conta.color,
          icon: conta.icon,
        });
        ativos[conta.type].total += conta.balance;
      }
    }

    const ativosFiltrados = Object.values(ativos).filter((a) => a.contas.length > 0);
    const totalAtivos = ativosFiltrados.reduce((acc, a) => acc + a.total, 0);

    const dividas = await prisma.debt.findMany({
      where: { userId: usuarioId, isDeleted: false, isArchived: false, isPaidOff: false },
    });

    const totalDividas = dividas.reduce(
      (acc, d) => acc + (d.installmentTotal - d.installmentPaid) * d.installmentValue,
      0,
    );

    const cartoes = await prisma.conta.findMany({
      where: { userId: usuarioId, type: "CREDIT_CARD", isActive: true, isDeleted: false, isArchived: false },
    });

    let totalFaturas = 0;
    for (const cartao of cartoes) {
      const faturaAtual = await prisma.transaction.aggregate({
        where: { userId: usuarioId, accountId: cartao.id, isDeleted: false, isArchived: false },
        _sum: { amount: true },
      });
      totalFaturas += faturaAtual._sum.amount || 0;
    }

    const totalPassivos = totalDividas + totalFaturas;
    const patrimonioLiquido = totalAtivos - totalPassivos;

    const composicao = ativosFiltrados.map((a) => ({
      tipo: a.tipo,
      valor: a.total,
      percentual: totalAtivos > 0 ? Math.round((a.total / totalAtivos) * 100) : 0,
    }));

    return {
      ativos: ativosFiltrados,
      totalAtivos,
      passivos: {
        dividas: { total: totalDividas, quantidade: dividas.length },
        faturasCartao: { total: totalFaturas, quantidade: cartoes.length },
        total: totalPassivos,
      },
      patrimonioLiquido,
      composicao,
    };
  }

  /**
   * Gera IA baseada em regras gerando "Dicas/Alertas".
   */
  async obterInsights(usuarioId: string) {
    const agora = new Date();
    const insights = [];
    
    // Insights resumidos para performance
    const dividas = await prisma.debt.findMany({
      where: { userId: usuarioId, isDeleted: false, isArchived: false, isPaidOff: false },
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

    const cartoes = await prisma.conta.findMany({
      where: {
        userId: usuarioId,
        type: "CREDIT_CARD",
        isActive: true,
        isDeleted: false, isArchived: false,
        limiteCredito: { gt: 0 },
      },
    });

    for (const cartao of cartoes) {
      const total = await prisma.transaction.aggregate({
        where: { userId: usuarioId, accountId: cartao.id, isDeleted: false, isArchived: false },
        _sum: { amount: true },
      });

      const usado = total._sum.amount || 0;
      const limite = cartao.limiteCredito || 1;
      const percentual = Math.round((usado / limite) * 100);

      if (percentual >= 90) {
        insights.push({
          tipo: "alerta",
          titulo: `Cartão ${cartao.name}: ${percentual}% usado`,
          descricao: `Cuidado! Seu cartão está quase no limite.`,
          icone: "⚠️",
        });
      }
    }

    return { insights, geradoEm: agora.toISOString() };
  }

  /**
   * Obtém a evolução mensal do saldo de receitas e despesas.
   */
  async obterBalanceEvolution(usuarioId: string, startDate?: string, endDate?: string) {
    const today = new Date();
    let end = endDate ? new Date(endDate) : today;
    let start = startDate ? new Date(startDate) : (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5);
      d.setDate(1);
      return d;
    })();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: usuarioId,
        status: "PAID",
        occurrenceDate: {
          gte: start,
          lte: end,
        },
        isDeleted: false, isArchived: false,
      },
      select: { amount: true, type: true, occurrenceDate: true },
      orderBy: { occurrenceDate: "asc" },
    });

    const monthlyData: Record<string, { income: number; expense: number }> = {};
    const iterStart = new Date(start);
    iterStart.setDate(1);

    for (let d = new Date(iterStart); d <= end; d.setMonth(d.getMonth() + 1)) {
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    transactions.forEach((transaction) => {
      const date = new Date(transaction.occurrenceDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (monthlyData[monthKey]) {
        if (transaction.type === "INCOME") monthlyData[monthKey].income += transaction.amount;
        else monthlyData[monthKey].expense += transaction.amount;
      }
    });

    let cumulativeBalance = 0;
    const data = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { income, expense }]) => {
        cumulativeBalance += income - expense;
        return { month, balance: cumulativeBalance, income, expense };
      });

    return {
      data,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
    };
  }

  /**
   * Projetar previsão de saldo por 6 meses contabilizando assinaturas, recorrentes e dividas.
   */
  async obterPrevisao(usuarioId: string) {
    const contas = await prisma.conta.findMany({
      where: { userId: usuarioId, isActive: true, isDeleted: false, isArchived: false, type: { not: "CREDIT_CARD" } },
    });
    const saldoAtual = contas.reduce((acc, c) => acc + c.balance, 0);

    const recorrentes = await prisma.transaction.findMany({
      where: { userId: usuarioId, isDeleted: false, isArchived: false, isRecurring: true },
    });

    const assinaturas = await prisma.assinatura.findMany({
      where: { usuarioId, ativa: true, isDeleted: false, isArchived: false },
    });

    const dividas = await prisma.debt.findMany({
      where: { userId: usuarioId, isDeleted: false, isArchived: false, isPaidOff: false },
    });

    const agora = new Date();
    const previsao = [];
    let saldoProjetado = saldoAtual;

    for (let i = 0; i < 6; i++) {
      const mesReferencia = new Date(agora.getFullYear(), agora.getMonth() + i + 1, 0);
      const mesLabel = mesReferencia.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

      let receitasMes = 0;
      let despesasMes = 0;

      for (const r of recorrentes) {
        if (r.type === "INCOME") receitasMes += r.amount;
        else despesasMes += r.amount;
      }

      for (const a of assinaturas) {
        let valorMensal = a.valor;
        switch (a.ciclo) {
          case "SEMANAL": valorMensal = a.valor * 4; break;
          case "QUINZENAL": valorMensal = a.valor * 2; break;
          case "BIMESTRAL": valorMensal = Math.round(a.valor / 2); break;
          case "TRIMESTRAL": valorMensal = Math.round(a.valor / 3); break;
          case "SEMESTRAL": valorMensal = Math.round(a.valor / 6); break;
          case "ANUAL": valorMensal = Math.round(a.valor / 12); break;
        }
        despesasMes += valorMensal;
      }

      for (const d of dividas) {
        if (d.installmentPaid < d.installmentTotal) {
          despesasMes += d.installmentValue;
        }
      }

      saldoProjetado = saldoProjetado + receitasMes - despesasMes;
      previsao.push({ mes: mesLabel, saldo: saldoProjetado, receitas: receitasMes, despesas: despesasMes });
    }

    const mesNegativo = previsao.find((p) => p.saldo < 0);

    return {
      saldoAtual,
      previsao,
      alerta: mesNegativo ? `Atenção: saldo projetado negativo em ${mesNegativo.mes}` : null,
      resumo: {
        mediaReceitas: previsao.length > 0 ? previsao[0].receitas : 0,
        mediaDespesas: previsao.length > 0 ? previsao[0].despesas : 0,
        saldoMensal: previsao.length > 0 ? previsao[0].receitas - previsao[0].despesas : 0,
      },
    };
  }

  /**
   * Obtém a distribuição de despesas por categoria entre datas.
   */
  async obterExpensesByCategory(usuarioId: string, startDate: string, endDate: string) {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: usuarioId,
        type: "EXPENSE",
        status: "PAID",
        occurrenceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        isDeleted: false, isArchived: false,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });

    const categoryTotals: Record<
      string,
      { name: string; color: string; total: number; transactions: any[] }
    > = {};

    transactions.forEach((transaction) => {
      const categoryName = transaction.category.name;
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = {
          name: categoryName,
          color: transaction.category.color || "#047857",
          total: 0,
          transactions: [],
        };
      }
      categoryTotals[categoryName].total += transaction.amount || 0;
      categoryTotals[categoryName].transactions.push({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.occurrenceDate,
      });
    });

    const grandTotal = Object.values(categoryTotals).reduce(
      (sum, cat) => sum + cat.total,
      0
    );

    const data = Object.entries(categoryTotals)
      .map(([categoryId, { name, color, total, transactions }]) => ({
        categoryId,
        categoryName: name,
        categoryColor: color,
        totalAmount: total,
        transactions, // Lista de itens individuais para o modal
        percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return { data, grandTotal };
  }

  /**
   * RECONSTRUÇÃO ENTERPRISE (P27)
   * Recalcula o saldo de todas as contas do usuário com base no histórico de transações PAID.
   */
  async sincronizarSaldos(usuarioId: string) {
    const contas = await prisma.conta.findMany({
      where: { userId: usuarioId, isDeleted: false, isArchived: false },
      select: { id: true, name: true }
    });

    const resultados = [];

    for (const conta of contas) {
      // Somar créditos
      const creditos = await prisma.transaction.aggregate({
        where: { accountId: conta.id, userId: usuarioId, status: "PAID", type: "INCOME", isDeleted: false },
        _sum: { amount: true }
      });

      // Somar débitos
      const debitos = await prisma.transaction.aggregate({
        where: { accountId: conta.id, userId: usuarioId, status: "PAID", type: "EXPENSE", isDeleted: false },
        _sum: { amount: true }
      });

      const totalCreditos = creditos._sum.amount || 0;
      const totalDebitos = debitos._sum.amount || 0;
      const saldoCalculado = totalCreditos - totalDebitos;

      // Atualizar no banco
      await prisma.conta.update({
        where: { id: conta.id },
        data: { balance: saldoCalculado }
      });

      resultados.push({
        conta: conta.name,
        saldoAnterior: "Remapeado",
        saldoAtual: saldoCalculado
      });
    }

    return {
      sucesso: true,
      mensagem: "Saldos sincronizados com sucesso a partir das transações.",
      detalhes: resultados
    };
  }
}

export const painelService = new PainelService();
