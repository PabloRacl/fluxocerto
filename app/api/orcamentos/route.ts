import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    
    // Na arquitetura P12+, orçamentos são limites nas Categorias
    const categories = await (prisma as any).category.findMany({
      where: { userId: session.user.email, isDeleted: false, budgetLimit: { gt: 0 } },
      include: { transactions: { where: { isDeleted: false } } }
    });

    const resumo = categories.map((cat: any) => {
      const spent = cat.transactions.reduce((acc: number, t: any) => acc + t.amount, 0);
      return {
        id: cat.id,
        name: cat.name,
        limit: cat.budgetLimit,
        spent,
        percentual: (spent / cat.budgetLimit) * 100
      };
    });

    return NextResponse.json(resumo);
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const { categoryId, limit } = body;

    const updated = await (prisma as any).category.update({
      where: { id: categoryId },
      data: { budgetLimit: Math.round(limit * 100) }
    });

    return NextResponse.json({ message: "Limite atualizado", category: updated });
  } catch (error) {
    console.error("Erro ao atualizar limite:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

