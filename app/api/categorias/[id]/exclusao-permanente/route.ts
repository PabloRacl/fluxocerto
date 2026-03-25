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

    const categoryId = params.id;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { user: true },
    });

    if (!category || category.user.email !== session.user.email) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    // Como é exclusão permanente de fato: Hard Delete. Soft Delete lida na rota /archive.
    await prisma.category.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir permanentemente a categoria:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
