import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// GET - Listar Cartões de Crédito com faturas calculadas
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

    const params = request.nextUrl.searchParams;
    const contaId = params.get("contaId");

    // Buscar todas as contas de cartão de crédito
    const where: any = {
      userId: user.id,
      type: "CREDIT_CARD",
      isActive: true,
      isDeleted: false,
    };
    if (contaId) where.id = contaId;

    const cartoes = await prisma.account.findMany({
      where,
      orderBy: { name: "asc" },
    });

    const agora = new Date();
    const cartoesComFatura = await Promise.all(
      cartoes.map(async (cartao) => {
        const diaFechamento = cartao.diaFechamento || 1;
        const diaVencimento = cartao.diaVencimento || 10;
        const limite = cartao.limiteCredito || 0;

        // Calcular período da fatura atual
        const {
          inicioFaturaAtual,
          fimFaturaAtual,
          vencimentoAtual,
          inicioProximaFatura,
          fimProximaFatura,
          vencimentoProxima,
        } = calcularPeriodosFatura(agora, diaFechamento, diaVencimento);

        // Buscar transações da fatura atual
        const transacoesFaturaAtual = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            accountId: cartao.id,
            isDeleted: false,
            occurrenceDate: { gte: inicioFaturaAtual, lte: fimFaturaAtual },
          },
          include: {
            category: { select: { id: true, name: true, color: true } },
          },
          orderBy: { occurrenceDate: "desc" },
        });

        // Buscar transações da fatura futura
        const transacoesFaturaFutura = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            accountId: cartao.id,
            isDeleted: false,
            occurrenceDate: { gte: inicioProximaFatura, lte: fimProximaFatura },
          },
          orderBy: { occurrenceDate: "desc" },
        });

        // Calcular totais
        const totalFaturaAtual = transacoesFaturaAtual.reduce(
          (acc, t) => acc + t.amount,
          0,
        );
        const totalFaturaFutura = transacoesFaturaFutura.reduce(
          (acc, t) => acc + t.amount,
          0,
        );

        // Calcular parcelas futuras (transações com isInstallment = true que ainda não apareceram)
        const parcelasFuturas = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            accountId: cartao.id,
            isDeleted: false,
            isInstallment: true,
            occurrenceDate: { gt: fimFaturaAtual },
          },
        });
        const totalParcelasFuturas = parcelasFuturas.reduce(
          (acc, t) => acc + t.amount,
          0,
        );

        // Limite disponível
        const comprometido = totalFaturaAtual + totalParcelasFuturas;
        const disponivel = Math.max(0, limite - comprometido);
        const percentualUsado =
          limite > 0 ? Math.round((comprometido / limite) * 100) : 0;

        return {
          ...cartao,
          faturaAtual: {
            periodo: { inicio: inicioFaturaAtual, fim: fimFaturaAtual },
            vencimento: vencimentoAtual,
            total: totalFaturaAtual,
            quantidade: transacoesFaturaAtual.length,
            transacoes: transacoesFaturaAtual,
          },
          faturaFutura: {
            periodo: { inicio: inicioProximaFatura, fim: fimProximaFatura },
            vencimento: vencimentoProxima,
            total: totalFaturaFutura,
            quantidade: transacoesFaturaFutura.length,
          },
          parcelasFuturas: {
            total: totalParcelasFuturas,
            quantidade: parcelasFuturas.length,
          },
          limite: {
            total: limite,
            comprometido,
            disponivel,
            percentualUsado,
          },
        };
      }),
    );

    return NextResponse.json({ cartoes: cartoesComFatura });
  } catch (error) {
    console.error("Erro ao listar cartões:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function calcularPeriodosFatura(
  data: Date,
  diaFechamento: number,
  diaVencimento: number,
) {
  const ano = data.getFullYear();
  const mes = data.getMonth();
  const dia = data.getDate();

  // Fatura atual: de (mês anterior, dia fechamento+1) até (mês atual, dia fechamento)
  let inicioFaturaAtual: Date;
  let fimFaturaAtual: Date;
  let vencimentoAtual: Date;

  if (dia > diaFechamento) {
    // Estamos após o fechamento, a fatura atual é do fechamento deste mês
    inicioFaturaAtual = new Date(ano, mes - 1, diaFechamento + 1);
    fimFaturaAtual = new Date(ano, mes, diaFechamento, 23, 59, 59);
    vencimentoAtual = new Date(
      ano,
      mes + (diaVencimento <= diaFechamento ? 1 : 0),
      diaVencimento,
    );
  } else {
    // Estamos antes do fechamento, a fatura atual é do fechamento do mês anterior
    inicioFaturaAtual = new Date(ano, mes - 2, diaFechamento + 1);
    fimFaturaAtual = new Date(ano, mes - 1, diaFechamento, 23, 59, 59);
    vencimentoAtual = new Date(ano, mes, diaVencimento);
  }

  // Próxima fatura
  const inicioProximaFatura = new Date(fimFaturaAtual.getTime() + 1000);
  const fimProximaFatura = new Date(
    inicioProximaFatura.getFullYear(),
    inicioProximaFatura.getMonth() + 1,
    diaFechamento,
    23,
    59,
    59,
  );
  const vencimentoProxima = new Date(
    fimProximaFatura.getFullYear(),
    fimProximaFatura.getMonth() + 1,
    diaVencimento,
  );

  return {
    inicioFaturaAtual,
    fimFaturaAtual,
    vencimentoAtual,
    inicioProximaFatura,
    fimProximaFatura,
    vencimentoProxima,
  };
}
