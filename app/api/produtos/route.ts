export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const params = request.nextUrl.searchParams;
    const busca = params.get("busca") || "";
    const categoria = params.get("categoria") || "";
    const barcode = params.get("barcode") || "";
    const popular = params.get("popular") === "true";
    const limite = parseInt(params.get("limite") || "50");

    if (barcode) {
      const produto = await prisma.produto.findUnique({ where: { barcode } });
      return NextResponse.json({ produto });
    }

    const where: any = {};
    if (busca) where.nome = { contains: busca, mode: "insensitive" };
    if (categoria) where.categoria = categoria;
    if (popular) where.popular = true;

    const produtos = await prisma.produto.findMany({
      where,
      orderBy: [{ popular: "desc" }, { nome: "asc" }],
      take: limite,
    });

    const categorias = await prisma.produto.findMany({
      select: { categoria: true },
      distinct: ["categoria"],
      orderBy: { categoria: "asc" },
    });

    return NextResponse.json({
      produtos,
      categorias: categorias.map((c) => c.categoria),
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const { nome, categoria, unidade, precoMedio, barcode } = body;

    if (!nome || !categoria) {
      return NextResponse.json(
        { error: "Nome e categoria são obrigatórios" },
        { status: 400 },
      );
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        categoria,
        unidade: unidade || "un",
        precoMedio: precoMedio ? Math.round(precoMedio * 100) : 0,
        barcode: barcode || null,
      },
    });

    return NextResponse.json(
      { message: "Produto criado", produto },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
