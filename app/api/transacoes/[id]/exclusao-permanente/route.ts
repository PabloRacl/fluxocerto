export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;

    const transacao = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!transacao || transacao.user.email !== session.user.email) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    await prisma.transaction.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir permanentemente transação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
