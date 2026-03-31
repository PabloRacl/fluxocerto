export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/biblioteca/autenticacao";
import { prisma } from "@/biblioteca/prisma";

// ============================================
// PUT: Atualizar conta
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se a conta existe e pertence ao usuário
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 },
      );
    }

    // Parse do body
    const body = await request.json();
    const { name, type, balance, color, icon, isActive } = body;

    // Validações
    if (!name || !type) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 },
      );
    }

    // Converter balance para centavos
    const balanceInCents = balance
      ? Math.round(parseFloat(balance) * 100)
      : existingAccount.balance;

    // Atualizar conta
    const updatedAccount = await prisma.account.update({
      where: { id: params.id },
      data: {
        name,
        type,
        balance: balanceInCents,
        color: color || existingAccount.color,
        icon: icon || existingAccount.icon,
        isActive: isActive !== undefined ? isActive : existingAccount.isActive,
      },
    });

    return NextResponse.json(
      {
        message: "Conta atualizada com sucesso",
        account: {
          ...updatedAccount,
          balanceFormatted: updatedAccount.balance / 100,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar conta" },
      { status: 500 },
    );
  }
}

// ============================================
// DELETE: Arquivar conta (Soft Delete)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se a conta existe e pertence ao usuário
    const account = await prisma.account.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 },
      );
    }

    // Regra de Negócio: Não excluir conta com transações (apenas arquivar)
    // Conforme documento: "Excluir Conta com Transações: Arquivar (não exclui)"

    // Atualizar para inativa (soft delete)
    const archivedAccount = await prisma.account.update({
      where: { id: params.id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json(
      {
        message: "Conta arquivada com sucesso",
        account: {
          ...archivedAccount,
          balanceFormatted: archivedAccount.balance / 100,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao arquivar conta:", error);
    return NextResponse.json(
      { error: "Erro interno ao arquivar conta" },
      { status: 500 },
    );
  }
}

// ============================================
// GET: Buscar conta específica
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Buscar conta específica
    const account = await prisma.account.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        ...account,
        balanceFormatted: account.balance / 100,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao buscar conta:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar conta" },
      { status: 500 },
    );
  }
}
