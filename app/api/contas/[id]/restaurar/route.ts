export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// post - restaurar conta arquivada
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const accountId = (await params).id;

    // 3. Verificar se conta existe, pertence ao usuário e está arquivada
    const account = await prisma.conta.findFirst({
      where: {
        id: accountId,
        userId: user.id,
        isActive: false, // Só permite restaurar contas arquivadas
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Conta não encontrada ou já está ativa" },
        { status: 404 },
      );
    }

    // 4. Restaurar conta (reativar)
    // ✅ CORREÇÃO: Removido archivedAt pois não existe no schema
    const restoredAccount = await prisma.conta.update({
      where: { id: accountId },
      data: {
        isActive: true,
        // archivedAt: null,  ← REMOVIDO: campo não existe no modelo
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        color: true,
        icon: true,
        isActive: true,
        createdAt: true,
      },
    });

    // 5. Retornar sucesso
    return NextResponse.json({
      message: "Conta restaurada com sucesso",
      account: restoredAccount,
    });
  } catch (error) {
    console.error("Erro ao restaurar conta:", error);
    return NextResponse.json(
      { error: "Erro interno ao restaurar conta" },
      { status: 500 },
    );
  }
}
