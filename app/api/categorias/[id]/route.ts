export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/biblioteca/autenticacao";
import { prisma } from "@/biblioteca/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, type, color, icon, parentId, isActive } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 },
      );
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo deve ser INCOME ou EXPENSE" },
        { status: 400 },
      );
    }

    if (parentId && parentId !== existingCategory.parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: { id: parentId, userId: user.id, parentId: null },
      });
      if (!parentCategory) {
        return NextResponse.json(
          { error: "Categoria pai inválida" },
          { status: 400 },
        );
      }
    }

    // ⚠️ ATENÇÃO: Deve ter EXATAMENTE:  data:  {
    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: name,
        type: type,
        color: color || existingCategory.color,
        icon: icon !== undefined ? icon : existingCategory.icon,
        parentId: parentId !== undefined ? parentId : existingCategory.parentId,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive,
      },
    });

    return NextResponse.json(
      {
        message: "Categoria atualizada com sucesso",
        category: updatedCategory,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Erro PUT categories:", error.message || error);
    return NextResponse.json(
      { error: "Erro interno: " + (error.message || error) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const category = await prisma.category.findFirst({
      where: { id: params.id, userId: user.id },
      include: { _count: { select: { transactions: true } } },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    if (category._count.transactions > 0) {
      return NextResponse.json(
        {
          error: "Não é possível arquivar categoria com transações",
          transactionCount: category._count.transactions,
        },
        { status: 400 },
      );
    }

    // ⚠️ ATENÇÃO: Deve ter EXATAMENTE:  data:  {
    const archivedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json(
      {
        message: "Categoria arquivada com sucesso",
        category: archivedCategory,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Erro DELETE categories:", error.message || error);
    return NextResponse.json(
      { error: "Erro interno: " + (error.message || error) },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const category = await prisma.category.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        _count: { select: { transactions: true } },
        parent: { select: { id: true, name: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(category, { status: 200 });
  } catch (error: any) {
    console.error("Erro GET category by ID:", error.message || error);
    return NextResponse.json(
      { error: "Erro interno: " + (error.message || error) },
      { status: 500 },
    );
  }
}
