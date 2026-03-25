import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

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

    const listas = await prisma.listaCompra.findMany({
      where: { usuarioId: user.id },
      include: { itens: { orderBy: { ordem: "asc" } } },
      orderBy: { criadoEm: "desc" },
    });

    return NextResponse.json({ listas });
  } catch (error) {
    console.error("Erro ao listar listas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

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
    const { nome, itens } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    const lista = await prisma.listaCompra.create({
      data: {
        usuarioId: user.id,
        nome,
        itens: itens?.length
          ? {
              create: itens.map((item: any, i: number) => ({
                nome: item.nome,
                quantidade: item.quantidade || 1,
                unidade: item.unidade || "un",
                precoMaximo: item.precoMaximo
                  ? Math.round(item.precoMaximo * 100)
                  : null,
                observacao: item.observacao || null,
                ordem: i,
              })),
            }
          : undefined,
      },
      include: { itens: true },
    });

    return NextResponse.json(
      { message: "Lista criada", lista },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar lista:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
