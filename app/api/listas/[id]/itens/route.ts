export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
      where: { id: (await params).id, usuarioId: user.id },
    });
    if (!lista)
      return NextResponse.json(
        { error: "Lista não encontrada" },
        { status: 404 },
      );

    const body = await request.json();
    const item = await prisma.listaCompraItem.create({
      data: {
        listaId: (await params).id,
        nome: body.nome,
        quantidade: body.quantidade || 1,
        unidade: body.unidade || "un",
        precoMaximo: body.precoMaximo
          ? Math.round(body.precoMaximo * 100)
          : null,
        observacao: body.observacao || null,
        ordem: body.ordem ?? 0,
      },
    });

    return NextResponse.json(
      { message: "Item adicionado", item },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const { itemId, ...data } = body;

    if (!itemId)
      return NextResponse.json(
        { error: "itemId é obrigatório" },
        { status: 400 },
      );

    const item = await prisma.listaCompraItem.update({
      where: { id: itemId, listaId: (await params).id },
      data: {
        nome: data.nome,
        quantidade: data.quantidade,
        unidade: data.unidade,
        comprado: data.comprado,
        precoMaximo:
          data.precoMaximo !== undefined
            ? data.precoMaximo
              ? Math.round(data.precoMaximo * 100)
              : null
            : undefined,
        observacao: data.observacao,
      },
    });

    return NextResponse.json({ message: "Item atualizado", item });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const itemId = searchParams.get("itemId");
    if (!itemId)
      return NextResponse.json(
        { error: "itemId é obrigatório" },
        { status: 400 },
      );

    await prisma.listaCompraItem.delete({
      where: { id: itemId, listaId: (await params).id },
    });
    return NextResponse.json({ message: "Item excluído" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
