import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// Gerar lista de compras a partir do estoque baixo
export async function GET() {
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

    const itensBaixo = await prisma.estoque.findMany({
      where: {
        usuarioId: user.id,
        ativo: true,
        quantidade: { lte: prisma.estoque.fields.estoqueMinimo },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ itensBaixo, total: itensBaixo.length });
  } catch (error) {
    console.error("Erro ao gerar lista de compras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Criar lista de compras automaticamente a partir do estoque baixo
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
    const nome = body.nome || "Reposição de Estoque";

    const itensBaixo = await prisma.estoque.findMany({
      where: {
        usuarioId: user.id,
        ativo: true,
        quantidade: { lte: prisma.estoque.fields.estoqueMinimo },
      },
    });

    if (itensBaixo.length === 0) {
      return NextResponse.json(
        { message: "Nenhum item com estoque baixo" },
        { status: 200 },
      );
    }

    const lista = await prisma.listaCompra.create({
      data: {
        usuarioId: user.id,
        nome,
        itens: {
          create: itensBaixo.map((item, i) => ({
            nome: item.nome,
            quantidade:
              Number(item.estoqueMinimo) - Number(item.quantidade) + 1,
            unidade: item.unidade,
            precoMaximo: item.precoMedio || item.precoUltimo,
            ordem: i,
          })),
        },
      },
      include: { itens: true },
    });

    return NextResponse.json(
      { message: "Lista criada", lista },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar lista automática:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
