import { prisma } from "@/biblioteca/prisma";
import { addDays, differenceInDays, isBefore, startOfDay, endOfDay } from "date-fns";

/**
 * Serviço de Projeção Financeira — O "Cérebro" de Investimento
 * Calcula o saldo futuro estimado consolidando dados de múltiplas fontes.
 */
export class ProjecaoService {
  /**
   * Gera uma projeção completa para os próximos N dias.
   */
  async gerarProjecao(usuarioId: string, dias: number = 90) {
    const hoje = startOfDay(new Date());
    const dataLimite = endOfDay(addDays(hoje, dias));

    // 1. Obter Saldo Atual Consolidado (Líquido de contas ativas)
    const contas = await prisma.conta.findMany({
      where: { userId: usuarioId, isDeleted: false, isArchived: false, isActive: true },
      select: { balance: true }
    });
    const saldoInicial = contas.reduce((sum, acc) => sum + acc.balance, 0);

    // 2. Transações Agendadas / Pendentes no Período
    const transacoesAgendadas = await prisma.transaction.findMany({
      where: {
        userId: usuarioId,
        isDeleted: false,
        isArchived: false,
        status: "PENDING",
        occurrenceDate: { gte: hoje, lte: dataLimite }
      },
      select: { amount: true, type: true, occurrenceDate: true }
    });

    // 3. Dívidas (Parcelas Vincendas)
    const dividas = await prisma.debt.findMany({
      where: {
        userId: usuarioId,
        isDeleted: false,
        isArchived: false,
        isPaidOff: false,
        nextDueDate: { lte: dataLimite }
      },
      select: { installmentValue: true, nextDueDate: true, installmentTotal: true, installmentPaid: true }
    });

    // 4. Assinaturas (Recorrências Automáticas)
    const assinaturas = await prisma.assinatura.findMany({
      where: {
        usuarioId: usuarioId,
        isDeleted: false,
        isArchived: false,
        ativa: true
      }
    });

    // 5. Motor de IA/Forecasting: Analisar Padrões Passados (Últimos 90 dias)
    const dataInicioHistorico = addDays(hoje, -90);
    const transacoesHistoricas = await prisma.transaction.findMany({
      where: {
        userId: usuarioId,
        isDeleted: false,
        isArchived: false,
        status: "PAID",
        occurrenceDate: { gte: dataInicioHistorico, lte: hoje }
      },
      select: { amount: true, type: true }
    });

    const totalGanhosHistoricos = transacoesHistoricas.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalGastosHistoricos = transacoesHistoricas.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    
    // Calcular Médias Diárias (Simulação Preditiva)
    const mediaGanhosDiaria = totalGanhosHistoricos / 90;
    const mediaGastosDiaria = totalGastosHistoricos / 90;

    // --- CÁLCULO DA TIMELINE ---
    const projeçãoPorDia = [];
    let saldoAcumulado = saldoInicial;
    const intervalo = dias <= 31 ? 1 : (dias <= 91 ? 2 : 5);
    const fatorInflacaoMensal = 0.005; // 0.5% ao mês acumulativo

    for (let i = 0; i <= dias; i += intervalo) {
      const dataAlvo = addDays(hoje, i);
      const dataInicioPonto = i === 0 ? hoje : addDays(hoje, i - intervalo + 1);
      
      // A. Transações Agendadas / Pendentes Reais
      const transacoesPonto = transacoesAgendadas.filter(t => 
        t.occurrenceDate >= dataInicioPonto && t.occurrenceDate <= dataAlvo
      );
      
      const ganhosReais = transacoesPonto.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const gastosReais = transacoesPonto.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

      // B. Assinaturas e Dívidas (Dados "Duros")
      let gastosEstruturais = 0;
      assinaturas.forEach(ass => {
        gastosEstruturais += this.calcularCustoAssinaturaNoPeriodo(ass, dataInicioPonto, dataAlvo);
      });

      const gastosDividas = dividas.filter(d => 
        d.nextDueDate >= dataInicioPonto && d.nextDueDate <= dataAlvo
      ).reduce((s, d) => s + d.installmentValue, 0);

      // C. Simulação Preditiva (Advinhar gastos futuros baseado no passado)
      // Ajustar pela inflação (quanto mais longe no tempo, mais caro)
      const mesesPassados = i / 30;
      const ajusteInflacao = 1 + (mesesPassados * fatorInflacaoMensal);
      
      const ganhosSimulados = mediaGanhosDiaria * intervalo;
      const gastosSimulados = mediaGastosDiaria * intervalo * ajusteInflacao;

      // Unificação do Fluxo (Real + Predição Inteligente)
      const ganhosTotaisPonto = ganhosReais + ganhosSimulados;
      const gastosTotaisPonto = gastosReais + gastosEstruturais + gastosDividas + gastosSimulados;

      saldoAcumulado += (ganhosTotaisPonto - gastosTotaisPonto);

      projeçãoPorDia.push({
        data: dataAlvo.toISOString(),
        saldoEstimado: Math.round(saldoAcumulado),
        ganhos: Math.round(ganhosTotaisPonto),
        gastos: Math.round(gastosTotaisPonto)
      });
    }

    return {
      resumo: {
        saldoAtual: saldoInicial,
        saldoFinal: Math.round(saldoAcumulado),
        variacaoTotal: Math.round(saldoAcumulado - saldoInicial),
        periodoDias: dias,
        modeloPrevisao: "PREDICTIVE_MA_90D"
      },
      timeline: projeçãoPorDia
    };
  }

  /**
   * Lógica auxiliar para decompor ciclos de assinatura (Mensal, Semanal, etc) dentro de um gap de datas.
   */
  private calcularCustoAssinaturaNoPeriodo(ass: any, inicio: Date, fim: Date): number {
    const proxima = new Date(ass.proximaRenovacao);
    
    // Se a próxima renovação está MUITO à frente do limite final, não conta nada ainda.
    if (isBefore(fim, proxima)) return 0;

    let custo = 0;
    let dataSimulada = proxima;

    // Garante que não entramos em loop infinito e capturamos até 24 renovações (2 anos)
    let safeLoop = 0;
    while (!isBefore(fim, dataSimulada) && safeLoop < 24) {
      // Se a renovação cai EXATAMENTE dentro da janela [inicio, fim]
      if (dataSimulada >= inicio && dataSimulada <= fim) {
        custo += ass.valor;
      }
      
      // Incrementar baseado no ciclo com precisão date-fns
      switch (ass.ciclo) {
        case 'SEMANAL': dataSimulada = addDays(dataSimulada, 7); break;
        case 'QUINZENAL': dataSimulada = addDays(dataSimulada, 14); break;
        case 'MENSAL': dataSimulada = addDays(dataSimulada, 30); break;
        case 'BIMESTRAL': dataSimulada = addDays(dataSimulada, 60); break;
        case 'TRIMESTRAL': dataSimulada = addDays(dataSimulada, 90); break;
        case 'SEMESTRAL': dataSimulada = addDays(dataSimulada, 180); break;
        case 'ANUAL': dataSimulada = addDays(dataSimulada, 365); break;
        default: safeLoop = 100; // Break
      }
      safeLoop++;
    }

    return custo;
  }
}

export const projecaoService = new ProjecaoService();
