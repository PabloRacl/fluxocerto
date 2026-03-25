import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// GET - Listar Assinaturas
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
    const showDeleted = params.get("showDeleted") === "true";
    const ativa = params.get("ativa");

    const where: any = { usuarioId: user.id, excluida: showDeleted };
    if (ativa !== null && ativa !== undefined && !showDeleted) {
      where.ativa = ativa === "true";
    }

    const assinaturas = await prisma.assinatura.findMany({
      where,
      include: {
        categoria: { select: { id: true, name: true, color: true } },
        conta: { select: { id: true, name: true, color: true, icon: true } },
      },
      orderBy: { proximaRenovacao: "asc" },
    });

    // Calcular métricas
    const ativas = assinaturas.filter((a) => a.ativa && !a.excluida);
    const valorMensal = ativas.reduce((acc, a) => {
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

    const proximasRenovacoes = ativas.filter((a) => {
      const dias = Math.ceil(
        (new Date(a.proximaRenovacao).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      return dias >= 0 && dias <= 7;
    });

    return NextResponse.json({
      assinaturas,
      resumo: {
        totalAtivas: ativas.length,
        valorMensal,
        valorAnual: valorMensal * 12,
        proximasRenovacoes: proximasRenovacoes.length,
      },
    });
  } catch (error) {
    console.error("Erro ao listar assinaturas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Criar Assinatura
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      nome,
      descricao,
      valor,
      ciclo,
      proximaRenovacao,
      categoriaId,
      contaId,
    } = body;

    if (!nome || !valor || !ciclo || !proximaRenovacao) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, valor, ciclo, próxima renovação" },
        { status: 400 },
      );
    }

    const assinatura = await prisma.assinatura.create({
      data: {
        usuarioId: user.id,
        nome,
        descricao: descricao || null,
        valor: Math.round(valor * 100),
        ciclo,
        proximaRenovacao: new Date(proximaRenovacao),
        categoriaId: categoriaId || null,
        contaId: contaId || null,
      },
      include: {
        categoria: { select: { id: true, name: true, color: true } },
        conta: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(
      { message: "Assinatura criada", assinatura },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
