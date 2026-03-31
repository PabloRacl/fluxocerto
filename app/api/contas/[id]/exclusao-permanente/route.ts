export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// ============================================
// DELETE - Exclusão Permanente de Conta
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 1. Verificar Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Buscar Usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const accountId = params.id;

    // 3. Verificar se conta existe, pertence ao usuário e está arquivada
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id,
        isActive: false,
      },
      include: {
        _count: {
          select: {
            transactions: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Conta não encontrada ou não está arquivada" },
        { status: 404 },
      );
    }

    // 4. Regra de Negócio: Não permitir excluir conta com transações ativas
    if (account._count.transactions > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir permanentemente uma conta com transações vinculadas",
          transactionCount: account._count.transactions,
        },
        { status: 400 },
      );
    }

    // 5. Excluir permanentemente (apenas se não tiver transações)
    await prisma.account.delete({
      where: { id: accountId },
    });

    // 6. Retornar sucesso
    return NextResponse.json({
      message: "Conta excluída permanentemente com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir conta permanentemente:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir conta" },
      { status: 500 },
    );
  }
}
