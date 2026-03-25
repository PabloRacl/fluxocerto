import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const lembrete = await prisma.lembrete.findFirst({
      where: { id: params.id, usuarioId: user.id },
    });
    if (!lembrete)
      return NextResponse.json(
        { error: "Lembrete não encontrado" },
        { status: 404 },
      );

    const body = await request.json();
    const updated = await prisma.lembrete.update({
      where: { id: params.id },
      data: {
        lido: body.lido ?? lembrete.lido,
        lidoEm: body.lido ? new Date() : lembrete.lidoEm,
      },
    });

    return NextResponse.json({
      message: "Lembrete atualizado",
      lembrete: updated,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    await prisma.lembrete.deleteMany({
      where: { id: params.id, usuarioId: user.id },
    });
    return NextResponse.json({ message: "Lembrete excluído" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
