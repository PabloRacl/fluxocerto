export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// PATCH - Restaurar dívida da lixeira
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const debt = await prisma.debt.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true } } },
    });

    if (!debt || debt.user.email !== session.user.email) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 });
    }

    await prisma.debt.update({
      where: { id: params.id },
      data: { isDeleted: false, deletedAt: null },
    });

    return NextResponse.json({ message: "Dívida restaurada com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Exclusão permanente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const debt = await prisma.debt.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true } } },
    });

    if (!debt || debt.user.email !== session.user.email) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 });
    }

    await prisma.debt.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Dívida excluída permanentemente" });
  } catch (error) {
    console.error("Erro ao excluir permanentemente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
