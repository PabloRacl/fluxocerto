import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// PATCH - Restaurar compra da lixeira
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const compra = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true } } },
    });

    if (!compra || compra.user.email !== session.user.email) {
      return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });
    }

    await prisma.purchase.update({
      where: { id: params.id },
      data: { isDeleted: false, deletedAt: null },
    });

    return NextResponse.json({ message: "Compra restaurada" });
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

    const compra = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true } } },
    });

    if (!compra || compra.user.email !== session.user.email) {
      return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });
    }

    await prisma.purchase.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Compra excluída permanentemente" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
