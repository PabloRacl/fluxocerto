import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/biblioteca/autenticacao";
import { prisma } from "@/biblioteca/prisma";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "INCOME" | "EXPENSE" | null;
    const includeInactive = searchParams.get("includeInactive") === "true";
    const showArchived = searchParams.get("showArchived") === "true";

    const where: any = {
      userId: user.id,
      isArchived: showArchived, // ✅ FIX: Filtra ativas vs lixeira
    };

    // Só filtra isActive quando NÃO estiver olhando a lixeira
    if (!showArchived && !includeInactive) {
      where.isActive = true;
    }

    if (type && ["INCOME", "EXPENSE"].includes(type)) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        icon: true,
        parentId: true,
        isActive: true,
        isArchived: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { transactions: true } },
      },
    });

    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    console.error("Erro GET categories:", error.message || error);
    return NextResponse.json(
      { error: "Erro interno: " + (error.message || error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, type, color, icon, parentId } = body;

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

    if (parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          userId: user.id,
          parentId: null,
        },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Categoria pai inválida" },
          { status: 400 },
        );
      }
    }

    // ⚠️ ATENÇÃO: A LINHA ABAIXO DEVE TER EXATAMENTE:  data:  {
    const newCategory = await prisma.category.create({
      data: {
        userId: user.id,
        name: name,
        type: type,
        color: color || "#047857",
        icon: icon || null,
        parentId: parentId || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: "Categoria criada com sucesso",
        category: newCategory,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Erro POST categories:", error.message || error);
    return NextResponse.json(
      { error: "Erro interno: " + (error.message || error) },
      { status: 500 },
    );
  }
}
