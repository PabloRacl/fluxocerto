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

    const item = await prisma.estoque.findFirst({
      where: { id: params.id, usuarioId: user.id },
    });
    if (!item)
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );
    return NextResponse.json({ item });
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

    const existing = await prisma.estoque.findFirst({
      where: { id: params.id, usuarioId: user.id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );

    const body = await request.json();
    const updated = await prisma.estoque.update({
      where: { id: params.id },
      data: {
        nome: body.nome ?? existing.nome,
        categoria:
          body.categoria !== undefined ? body.categoria : existing.categoria,
        quantidade:
          body.quantidade !== undefined ? body.quantidade : existing.quantidade,
        unidade: body.unidade ?? existing.unidade,
        precoMedio:
          body.precoMedio !== undefined
            ? Math.round(body.precoMedio * 100)
            : existing.precoMedio,
        precoUltimo:
          body.precoUltimo !== undefined
            ? Math.round(body.precoUltimo * 100)
            : existing.precoUltimo,
        ultimaCompra: body.ultimaCompra
          ? new Date(body.ultimaCompra)
          : existing.ultimaCompra,
        validade:
          body.validade !== undefined
            ? body.validade
              ? new Date(body.validade)
              : null
            : existing.validade,
        estoqueMinimo: body.estoqueMinimo ?? existing.estoqueMinimo,
        ativo: body.ativo ?? existing.ativo,
      },
    });

    return NextResponse.json({ message: "Item atualizado", item: updated });
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

    const item = await prisma.estoque.findFirst({
      where: { id: params.id, usuarioId: user.id },
    });
    if (!item)
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );

    await prisma.estoque.update({
      where: { id: params.id },
      data: { ativo: false },
    });
    return NextResponse.json({ message: "Item desativado" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
