import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// ============================================
// GET - Listar Metas do Usuário
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const params = request.nextUrl.searchParams;
    const showDeleted = params.get("showDeleted") === "true";

    const metas = await prisma.meta.findMany({
      where: { usuarioId: user.id, excluida: showDeleted },
      include: {
        categoria: { select: { id: true, name: true, color: true, icon: true } },
      },
      orderBy: { criadoEm: "desc" },
    });

    // Calcular projeções e resumo
    const metasComProjecao = metas.map((meta) => {
      const progresso = meta.valorAlvo > 0
        ? Math.min(100, Math.round((meta.montanteAtual / meta.valorAlvo) * 100))
        : 0;

      // Projeção: quantos meses faltam baseado no ritmo médio
      const mesesDesdeInicio = Math.max(1, Math.ceil(
        (Date.now() - new Date(meta.criadoEm).getTime()) / (1000 * 60 * 60 * 24 * 30)
      ));
      const mediaMensal = meta.montanteAtual / mesesDesdeInicio;
      const restante = meta.valorAlvo - meta.montanteAtual;
      const mesesParaAtingir = mediaMensal > 0 ? Math.ceil(restante / mediaMensal) : null;

      return {
        ...meta,
        progresso,
        mediaMensal: Math.round(mediaMensal),
        mesesParaAtingir,
      };
    });

    const ativas = metasComProjecao.filter((m) => !m.concluida);
    const concluidas = metasComProjecao.filter((m) => m.concluida);
    const totalAlvo = ativas.reduce((acc, m) => acc + m.valorAlvo, 0);
    const totalAtual = ativas.reduce((acc, m) => acc + m.montanteAtual, 0);

    return NextResponse.json({
      metas: metasComProjecao,
      resumo: {
        totalMetas: ativas.length,
        totalConcluidas: concluidas.length,
        totalAlvo,
        totalAtual,
        progressoGeral: totalAlvo > 0 ? Math.round((totalAtual / totalAlvo) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Erro ao listar metas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ============================================
// POST - Criar Nova Meta
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const body = await request.json();
    const { nome, descricao, valorAlvo, montanteAtual = 0, prazo, categoriaId, icone, cor } = body;

    if (!nome || !valorAlvo) {
      return NextResponse.json({ error: "Nome e valor alvo são obrigatórios" }, { status: 400 });
    }

    const meta = await prisma.meta.create({
      data: {
        usuarioId: user.id,
        nome,
        descricao: descricao || null,
        valorAlvo,
        montanteAtual,
        prazo: prazo ? new Date(prazo) : null,
        categoriaId: categoriaId || null,
        icone: icone || null,
        cor: cor || "#10B981",
      },
    });

    return NextResponse.json({ message: "Meta criada com sucesso", meta }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
