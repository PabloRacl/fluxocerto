import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  conquistado: boolean;
  progresso: number;
}

// GET - Gamificação (Badges, Nível, Streak)
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
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    // Métricas básicas
    const totalTransacoes = await prisma.transaction.count({
      where: { userId: user.id, isDeleted: false },
    });

    const totalContas = await prisma.account.count({
      where: { userId: user.id, isActive: true, isDeleted: false },
    });

    const totalCategorias = await prisma.category.count({
      where: { userId: user.id, isActive: true, isArchived: false },
    });

    const metasConcluidas = await prisma.meta.count({
      where: { usuarioId: user.id, concluida: true, excluida: false },
    });

    const dividasQuitadas = await prisma.debt.count({
      where: { userId: user.id, isPaidOff: true, isDeleted: false },
    });

    const mesesAtivos = await prisma.transaction.groupBy({
      by: ["occurrenceDate"],
      where: { userId: user.id, isDeleted: false },
      _count: true,
    });

    // Calcular streak (dias consecutivos com transações)
    const transacoesRecentes = await prisma.transaction.findMany({
      where: { userId: user.id, isDeleted: false },
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

    // Calcular nível baseado em XP
    const xp =
      totalTransacoes * 10 +
      metasConcluidas * 100 +
      dividasQuitadas * 50 +
      totalContas * 20 +
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

    // Badges
    const badges: Badge[] = [
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
        id: "100_transacoes",
        nome: "Centenário",
        descricao: "Registre 100 transações",
        icone: "💯",
        conquistado: totalTransacoes >= 100,
        progresso: Math.min(100, Math.round((totalTransacoes / 100) * 100)),
      },
      {
        id: "multiplas_metas",
        nome: "Ambicioso",
        descricao: "Conclua 3 metas financeiras",
        icone: "🌟",
        conquistado: metasConcluidas >= 3,
        progresso: Math.min(100, Math.round((metasConcluidas / 3) * 100)),
      },
      {
        id: "sem_dividas_3",
        nome: "Quitador",
        descricao: "Quite 3 dívidas",
        icone: "💪",
        conquistado: dividasQuitadas >= 3,
        progresso: Math.min(100, Math.round((dividasQuitadas / 3) * 100)),
      },
    ];

    const totalBadges = badges.length;
    const badgesConquistados = badges.filter((b) => b.conquistado).length;

    return NextResponse.json({
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
        totalBadges,
        badgesConquistados,
        totalTransacoes,
        metasConcluidas,
        dividasQuitadas,
      },
    });
  } catch (error) {
    console.error("Erro ao calcular gamificação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
