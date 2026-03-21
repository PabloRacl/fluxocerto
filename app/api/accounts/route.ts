import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================
// GET: Listar todas as contas do usuário logado
// ============================================
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar contas do usuário (apenas ativas por padrão)
    const accounts = await prisma.account.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: {
        name: "asc",
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
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Converter balance de centavos para formato legível
    const formattedAccounts = accounts.map((acc) => ({
      ...acc,
      balanceFormatted: acc.balance / 100,
    }));

    return NextResponse.json(formattedAccounts, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar contas" },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Criar nova conta
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Parse do body da requisição
    const body = await request.json();
    const { name, type, balance, color, icon } = body;

    // Validações básicas
    if (!name || !type) {
      return NextResponse.json(
        { error: "Nome e tipo da conta são obrigatórios" },
        { status: 400 }
      );
    }

    // Converter balance para centavos (se enviado como decimal)
    const balanceInCents = balance 
      ? Math.round(parseFloat(balance) * 100) 
      : 0;

    // Criar conta no banco
    const newAccount = await prisma.account.create({
      data: {
        userId: user.id,
        name,
        type,
        balance: balanceInCents,
        color: color || "#047857", // Default: Verde Floresta
        icon: icon || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: "Conta criada com sucesso",
        account: {
          ...newAccount,
          balanceFormatted: newAccount.balance / 100,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar conta" },
      { status: 500 }
    );
  }
}