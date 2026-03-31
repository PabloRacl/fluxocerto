export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// Consumir (reduzir) quantidade do estoque
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
    const { estoqueId, quantidade } = body;

    if (!estoqueId || !quantidade) {
      return NextResponse.json(
        { error: "estoqueId e quantidade são obrigatórios" },
        { status: 400 },
      );
    }

    const item = await prisma.estoque.findFirst({
      where: { id: estoqueId, usuarioId: user.id },
    });
    if (!item)
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );

    const novaQuantidade = Math.max(0, Number(item.quantidade) - quantidade);

    const updated = await prisma.estoque.update({
      where: { id: estoqueId },
      data: { quantidade: novaQuantidade },
    });

    return NextResponse.json({
      message:
        novaQuantidade <= Number(item.estoqueMinimo)
          ? "Estoque baixo!"
          : "Consumo registrado",
      item: updated,
      alertaEstoqueBaixo: novaQuantidade <= Number(item.estoqueMinimo),
    });
  } catch (error) {
    console.error("Erro ao consumir estoque:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
