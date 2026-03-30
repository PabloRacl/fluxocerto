import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const meta = await prisma.meta.findFirst({
      where: { id: params.id, usuarioId: user.id, isArchived: true },
    });

    if (!meta) {
      return NextResponse.json(
        { error: "Meta não encontrada ou não está excluída" },
        { status: 404 },
      );
    }

    await prisma.meta.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Meta excluída permanentemente" });
  } catch (error) {
    console.error("Erro ao excluir meta permanentemente:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir meta" },
      { status: 500 },
    );
  }
}
