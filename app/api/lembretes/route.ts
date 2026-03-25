import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const params = request.nextUrl.searchParams;
    const showRead = params.get("showRead") === "true";

    const lembretes = await prisma.lembrete.findMany({
      where: { usuarioId: user.id, lido: showRead ? undefined : false },
      orderBy: { notificarEm: "asc" },
    });

    const totalNaoLidos = await prisma.lembrete.count({
      where: { usuarioId: user.id, lido: false },
    });

    return NextResponse.json({ lembretes, totalNaoLidos });
  } catch (error) {
    console.error("Erro ao listar lembretes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
      titulo,
      mensagem,
      tipo,
      diasAntesDeNotificar,
      notificarEm,
      referenciaId,
      referenciaTipo,
    } = body;

    if (!titulo || !tipo || !notificarEm) {
      return NextResponse.json(
        { error: "Título, tipo e data são obrigatórios" },
        { status: 400 },
      );
    }

    const lembrete = await prisma.lembrete.create({
      data: {
        usuarioId: user.id,
        titulo,
        mensagem: mensagem || null,
        tipo,
        diasAntesDeNotificar: diasAntesDeNotificar ?? 3,
        notificarEm: new Date(notificarEm),
        referenciaId: referenciaId || null,
        referenciaTipo: referenciaTipo || null,
      },
    });

    return NextResponse.json(
      { message: "Lembrete criado", lembrete },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar lembrete:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
