import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// ============================================
// GET - Listar Notificações
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
    const apenasNaoLidas = params.get("apenasNaoLidas") === "true";

    const where: any = { usuarioId: user.id };
    if (apenasNaoLidas) where.lido = false;

    const lembretes = await prisma.lembrete.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      take: 50,
    });

    const naoLidas = await prisma.lembrete.count({
      where: { usuarioId: user.id, lido: false },
    });

    return NextResponse.json({
      notificacoes: lembretes,
      naoLidas,
    });
  } catch (error) {
    console.error("Erro ao listar notificações:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ============================================
// POST - Criar Notificação Manual
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
    const { titulo, mensagem, tipo, notificarEm, referenciaId, referenciaTipo } = body;

    if (!titulo || !tipo) {
      return NextResponse.json({ error: "Título e tipo são obrigatórios" }, { status: 400 });
    }

    const lembrete = await prisma.lembrete.create({
      data: {
        usuarioId: user.id,
        titulo,
        mensagem: mensagem || null,
        tipo,
        notificarEm: notificarEm ? new Date(notificarEm) : new Date(),
        referenciaId: referenciaId || null,
        referenciaTipo: referenciaTipo || null,
      },
    });

    return NextResponse.json({ message: "Notificação criada", notificacao: lembrete }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ============================================
// PATCH - Marcar como lida (batch)
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const body = await request.json();
    const { ids, marcarTodas } = body;

    if (marcarTodas) {
      await prisma.lembrete.updateMany({
        where: { usuarioId: user.id, lido: false },
        data: { lido: true, lidoEm: new Date() },
      });
    } else if (ids && Array.isArray(ids)) {
      await prisma.lembrete.updateMany({
        where: { id: { in: ids }, usuarioId: user.id },
        data: { lido: true, lidoEm: new Date() },
      });
    }

    return NextResponse.json({ message: "Notificações marcadas como lidas" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
