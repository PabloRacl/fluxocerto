export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const categoryId = (await params).id;
    const body = await request.json();
    const { isArchived } = body;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { user: true },
    });

    if (!category || category.user.email !== session.user.email) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        isArchived,
        archivedAt: isArchived ? new Date() : null,
        isActive: !isArchived, // Desativa quando vai pra lixeira
      },
    });

    return NextResponse.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error("Erro ao arquivar categoria:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
