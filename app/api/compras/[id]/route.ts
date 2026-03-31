export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// GET - Detalhe da Compra
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const compra = await prisma.purchase.findUnique({
      where: { id: (await params).id },
      include: {
        user: { select: { email: true } },
        items: { orderBy: { createdAt: "asc" } },
        category: { select: { id: true, name: true, color: true } },
        account: { select: { id: true, name: true } },
        transaction: { select: { id: true, status: true } },
      },
    });

    if (!compra || compra.user.email !== session.user.email) {
      return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ compra });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Soft Delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const compra = await prisma.purchase.findUnique({
      where: { id: (await params).id },
      include: { user: { select: { email: true } } },
    });

    if (!compra || compra.user.email !== session.user.email) {
      return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });
    }

    await prisma.purchase.update({
      where: { id: (await params).id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Compra enviada para lixeira" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
