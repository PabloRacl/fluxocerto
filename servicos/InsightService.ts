import { prisma } from "@/biblioteca/prisma";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";
import { vendaService } from "./VendaService";
import { notificacaoService } from "./NotificacaoService";


/**
 * Serviço de Insights — O Analista Financeiro Virtual.
 * Processa dados históricos e atuais para gerar o Score de Saúde (0-100).
 */
export class InsightService {
  /**
   * Calcula o Índice de Saúde Financeira consolidado.
   */
  async calcularSaudeFinanceira(usuarioId: string) {
    const hoje = new Date();
    const mesAtualInicio = startOfMonth(hoje);
    const mesAnteriorInicio = startOfMonth(subMonths(hoje, 1));
    const mesAnteriorFim = endOfMonth(subMonths(hoje, 1));

    // 1. DADOS DE ENTRADA (Mês Anterior para maior precisão de ciclo fechado)
    const transacoesMes = await prisma.transaction.findMany({
      where: {
        userId: usuarioId,
        isDeleted: false, isArchived: false,
        status: "PAID",
        occurrenceDate: { gte: mesAnteriorInicio, lte: mesAnteriorFim }
      },
      select: { amount: true, type: true }
    });

    const receitas = transacoesMes.filter(t => t.type === 'INCOME').reduce((s, t) => s + (t.amount || 0), 0) || 0;
    const despesas = transacoesMes.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + (t.amount || 0), 0) || 0;

    // 2. DADOS DE PATRIMÔNIO E DÍVIDA
    const contas = await prisma.account.findMany({
      where: { userId: usuarioId, isDeleted: false, isArchived: false },
      select: { balance: true }
    });
    const saldoLiquido = contas.reduce((s, a) => s + (a.balance || 0), 0) || 0;

    const dividasMes = await prisma.debt.findMany({
      where: { userId: usuarioId, isDeleted: false, isArchived: false, isPaidOff: false },
      select: { installmentValue: true }
    });
    const comprometimentoMensalDivida = dividasMes.reduce((s, d) => s + (d.installmentValue || 0), 0) || 0;

    const assets = await prisma.asset.findMany({
      where: { usuarioId, isDeleted: false, isArchived: false },
      select: { tipo: true }
    });

    // --- CÁLCULO DOS PILARES ---
    let score = 0;
    const detalhes = [];

    // Pilar 1: Taxa de Poupança (Peso 40)
    const taxaPoupanca = receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0;
    let pontosPoupanca = 0;
    if (taxaPoupanca > 30) pontosPoupanca = 40;
    else if (taxaPoupanca > 10) pontosPoupanca = 25;
    else if (taxaPoupanca > 0) pontosPoupanca = 10;
    score += pontosPoupanca;
    detalhes.push({ pilar: "Taxa de Poupança", valor: `${taxaPoupanca.toFixed(1)}%`, pontos: pontosPoupanca, max: 40 });

    // Pilar 2: Reserva de Emergência (Peso 30)
    const mediaGastos = despesas > 0 ? despesas : 1; // Fallback para evitar divisao por zero
    const mesesCobertura = saldoLiquido / mediaGastos;
    let pontosReserva = 0;
    if (mesesCobertura > 6) pontosReserva = 30;
    else if (mesesCobertura > 3) pontosReserva = 20;
    else if (mesesCobertura >= 1) pontosReserva = 10;
    score += pontosReserva;
    detalhes.push({ pilar: "Reserva de Emergência", valor: `${mesesCobertura.toFixed(1)} meses`, pontos: pontosReserva, max: 30 });

    // Pilar 3: Endividamento (Peso 20)
    const taxaEndividamento = receitas > 0 ? (comprometimentoMensalDivida / receitas) * 100 : 0;
    let pontosDivida = 0;
    if (taxaEndividamento < 20) pontosDivida = 20;
    else if (taxaEndividamento < 50) pontosDivida = 10;
    score += pontosDivida;
    detalhes.push({ pilar: "Nível de Dívida", valor: `${taxaEndividamento.toFixed(1)}%`, pontos: pontosDivida, max: 20 });

    // Pilar 4: Diversidade de Ativos (Peso 10)
    const tiposUnicos = new Set(assets.map((a: { tipo: string }) => a.tipo)).size;
    let pontosDiversidade = tiposUnicos >= 3 ? 10 : tiposUnicos * 4;
    score += pontosDiversidade;
    detalhes.push({ pilar: "Diversidade Patrimonial", valor: `${tiposUnicos} tipos`, pontos: pontosDiversidade, max: 10 });

    // --- RECOMENDAÇÕES ---
    const sugestoes: string[] = [];
    if (taxaPoupanca <= 10) sugestoes.push("Sua taxa de poupança está baixa. Tente reduzir gastos fixos em 10%.");
    if (mesesCobertura < 3) sugestoes.push("Sua reserva de emergência está vulnerável. Priorize acumular 3 meses de gastos.");
    if (taxaEndividamento > 30) sugestoes.push("Seu endividamento está alto. Evite novos parcelamentos e tente renegociar juros.");

    // --- RECOMENDAÇÕES (UI Format) ---
    const insights = [];

    const status = score > 80 ? 'EXCELENTE' : score > 50 ? 'BOM' : 'ALERTA';

    // Card de Pontuação (Destaque)
    insights.push({
      tipo: score > 50 ? "positivo" : "alerta",
      titulo: `Saúde: ${score}/100`,
      descricao: `Seu status atual é ${status}. ${sugestoes[0] || "Continue mantendo o bom hábito financeiro!"}`,
      icone: score > 50 ? "🎯" : "⚠️"
    });

    // Analise de Poupança
    if (taxaPoupanca > 0) {
      insights.push({
        tipo: taxaPoupanca > 20 ? "positivo" : "info",
        titulo: "Economia do Mês",
        descricao: `Você poupou ${taxaPoupanca.toFixed(1)}% do que recebeu no último período.`,
        icone: "💰"
      });
    }

    // Alertas de Reserva
    if (mesesCobertura < 3) {
      insights.push({
        tipo: "alerta",
        titulo: "Reserva de Emergência",
        descricao: "Seu colchão financeiro está abaixo do recomendado (3-6 meses).",
        icone: "🛡️"
      });
    }

    // --- INSIGHTS DE METAS (P10) ---
    const metas = await prisma.meta.findMany({
      where: { usuarioId, isDeleted: false, isArchived: false, concluida: false },
      select: { nome: true, valorAlvo: true, montanteAtual: true }
    });

    metas.forEach((meta: any) => {
      const progresso = (meta.montanteAtual / meta.valorAlvo) * 100;
      if (progresso >= 90) {
        insights.push({
          tipo: "positivo",
          titulo: "Quase lá!",
          descricao: `Faltam apenas R$ ${((meta.valorAlvo - meta.montanteAtual)/100).toFixed(2)} para você realizar seu sonho: "${meta.nome}".`,
          icone: "🎯"
        });
      }
    });

    // --- INSIGHTS DE ESTOQUE (P11) ---
    const estoque = await prisma.estoque.findMany({
      where: { usuarioId, isDeleted: false, isArchived: false },
      select: { nome: true, quantidade: true, estoqueMinimo: true, validade: true }
    });

    estoque.forEach((item: any) => {
      if (item.quantidade <= item.estoqueMinimo) {
        insights.push({
          tipo: "alerta",
          titulo: "Reposição: " + item.nome,
          descricao: `Seu estoque de "${item.nome}" está baixo (${item.quantidade}). Hora de ir ao Atacarejo!`,
          icone: "🛒"
        });
      }
      if (item.validade) {
        const dias = Math.ceil((new Date(item.validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (dias <= 3 && dias >= 0) {
           insights.push({
             tipo: "alerta",
             titulo: "Validade: " + item.nome,
             descricao: `O item "${item.nome}" vence em ${dias === 0 ? 'hoje' : dias + ' dias'}. Use-o logo!`,
             icone: "🕒"
           });
        }
      }
    });

    // --- INSIGHTS DE ORÇAMENTO (P12 CONSOLIDADO) ---
    const categoriasComLimite = await prisma.category.findMany({
      where: { userId: usuarioId, budgetLimit: { gt: 0 }, isActive: true, isArchived: false, type: 'EXPENSE' },
      select: { id: true, name: true, budgetLimit: true }
    });

    for (const cat of categoriasComLimite) {
      const gastoTotal = await prisma.transaction.aggregate({
        where: {
          categoryId: cat.id,
          userId: usuarioId,
          status: 'PAID',
          type: 'EXPENSE',
          isDeleted: false,
          occurrenceDate: { gte: mesAtualInicio }
        },
        _sum: { amount: true }
      });

      const gastoReal = gastoTotal._sum.amount || 0;
      const limit = cat.budgetLimit || 0;
      const percentual = limit > 0 ? (gastoReal / limit) * 100 : 0;

      if (percentual >= 100) {
        notificacaoService.notificar(usuarioId, {
          titulo: "Orçamento Estourado",
          mensagem: `Você ultrapassou o limite na categoria ${cat.name}.`,
          tipo: "WARNING",
          lembreteTipo: "ALERTA_ORCAMENTO",
          url: "/painel/categorias"
        }).catch(console.error);

        insights.push({
          tipo: "alerta",
          titulo: "Orçamento Estourado: " + cat.name,
          descricao: `Você ultrapassou o limite de R$ ${((cat.budgetLimit || 0)/100).toFixed(0)} nesta categoria.`,
          icone: "🚫"
        });
      } else if (percentual >= 80) {
        notificacaoService.notificar(usuarioId, {
          titulo: "Alerta de Orçamento",
          mensagem: `Você atingiu ${percentual.toFixed(0)}% do limite de ${cat.name}.`,
          tipo: "INFO",
          lembreteTipo: "ALERTA_ORCAMENTO",
          url: "/painel/categorias"
        }).catch(console.error);

        insights.push({
          tipo: "info",
          titulo: "Atenção ao Orçamento: " + cat.name,
          descricao: `Você já consumiu ${percentual.toFixed(0)}% do limite de "${cat.name}".`,
          icone: "📊"
        });
      }
    }

    // --- INSIGHTS DE NEGÓCIOS (P13 MEI) ---
    const performanceBiz = await vendaService.obterPerformance(usuarioId);
    if (performanceBiz.resumo.faturamentoTotal > 0) {
      insights.push({
        tipo: "positivo",
        titulo: "Performance Comercial",
        descricao: `Seu lucro de revenda este mês é de R$ ${(performanceBiz.resumo.lucroTotal / 100).toFixed(2)}. Margem de ${performanceBiz.resumo.margemMedia}.`,
        icone: "📈",
      });
      
      const margemStr = performanceBiz.resumo.margemMedia || "0%";
      const margem = Number(margemStr.replace('%','')) || 0;
      if (margem < 20) {
        sugestoes.push("Sua margem de lucro em vendas está baixa (<20%). Reveja seus custos de aquisição ou preços de venda.");
      }
    }

    // --- INTEGRACAO GAMIFICACAO E MASCOTE (EXCLUSIVO P28) ---
    const mood = score > 70 ? "HAPPY" : score < 40 ? "WORRIED" : "HAPPY";

    return {
      score: Math.min(100, score),
      status,
      detalhes,
      sugestoes,
      insights,
      mascotMood: mood // ✅ Humor do Sapinho baseado na Saúde
    };
  }
}

export const insightService = new InsightService();
