import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// Adicionar produto do catálogo ao estoque
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
    const { produtoId, quantidade, validade } = body;

    if (!produtoId)
      return NextResponse.json(
        { error: "produtoId é obrigatório" },
        { status: 400 },
      );

    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
    });
    if (!produto)
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );

    // Verificar se já existe no estoque
    const existente = await prisma.estoque.findFirst({
      where: { usuarioId: user.id, produtoId: produto.id, ativo: true },
    });

    let item;
    if (existente) {
      item = await prisma.estoque.update({
        where: { id: existente.id },
        data: {
          quantidade: { increment: quantidade || 1 },
          precoUltimo: body.precoUltimo
            ? Math.round(body.precoUltimo * 100)
            : existente.precoUltimo,
          precoMedio: body.precoMedio
            ? Math.round(body.precoMedio * 100)
            : existente.precoMedio,
          ultimaCompra: new Date(),
          validade: validade ? new Date(validade) : existente.validade,
        },
      });
    } else {
      item = await prisma.estoque.create({
        data: {
          usuarioId: user.id,
          produtoId: produto.id,
          nome: produto.nome,
          categoria: produto.categoria,
          quantidade: quantidade || 1,
          unidade: produto.unidade,
          precoMedio: body.precoMedio
            ? Math.round(body.precoMedio * 100)
            : produto.precoMedio,
          precoUltimo: body.precoUltimo
            ? Math.round(body.precoUltimo * 100)
            : 0,
          validade: validade ? new Date(validade) : null,
          ultimaCompra: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        message: existente
          ? "Estoque atualizado"
          : "Item adicionado ao estoque",
        item,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao adicionar ao estoque:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
