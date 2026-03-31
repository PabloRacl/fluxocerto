export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function GET(
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

    const lista = await prisma.listaCompra.findFirst({
      where: { id: params.id, usuarioId: user.id },
      include: { itens: { orderBy: { ordem: "asc" } } },
    });
    if (!lista)
      return NextResponse.json(
        { error: "Lista não encontrada" },
        { status: 404 },
      );
    return NextResponse.json({ lista });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

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

    const lista = await prisma.listaCompra.findFirst({
      where: { id: params.id, usuarioId: user.id },
    });
    if (!lista)
      return NextResponse.json(
        { error: "Lista não encontrada" },
        { status: 404 },
      );

    const body = await request.json();
    const updated = await prisma.listaCompra.update({
      where: { id: params.id },
      data: {
        nome: body.nome ?? lista.nome,
        concluida: body.concluida ?? lista.concluida,
        concluidaEm: body.concluida ? new Date() : lista.concluidaEm,
      },
      include: { itens: true },
    });

    return NextResponse.json({ message: "Lista atualizada", lista: updated });
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

    const lista = await prisma.listaCompra.findFirst({
      where: { id: params.id, usuarioId: user.id },
    });
    if (!lista)
      return NextResponse.json(
        { error: "Lista não encontrada" },
        { status: 404 },
      );

    await prisma.listaCompra.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Lista excluída" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
