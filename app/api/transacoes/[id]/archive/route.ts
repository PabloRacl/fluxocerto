import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const transactionId = params.id;
    const body = await request.json();
    const { isArchived } = body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    });

    if (!transaction || transaction.user.email !== session.user.email) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        isDeleted: isArchived,
        deletedAt: isArchived ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, transaction: updatedTransaction });
  } catch (error) {
    console.error("Erro ao arquivar transação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
