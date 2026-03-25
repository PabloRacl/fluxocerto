import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/biblioteca/autenticacao";
import { prisma } from "@/biblioteca/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;
    const { isArchived } = await request.json();

    // Verificar se a transação existe e pertence ao usuário
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || transaction.userId !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Atualizar status de exclusão lógica ("arquivamento" na UI de edição)
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        isDeleted: isArchived,
        deletedAt: isArchived ? new Date() : null,
      },
      include: {
        account: true,
        category: true,
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Erro ao arquivar transação:", error);
    return NextResponse.json(
      { error: "Erro ao arquivar transação" },
      { status: 500 },
    );
  }
}
