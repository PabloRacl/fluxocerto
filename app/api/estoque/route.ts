import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const params = request.nextUrl.searchParams;
    const showInactive = params.get("showInactive") === "true";

    const estoque = await prisma.estoque.findMany({
      where: { usuarioId: user.id, ativo: !showInactive },
      orderBy: { nome: "asc" },
    });

    const totalItens = estoque.length;
    const valorTotal = estoque.reduce(
      (sum, e) => sum + e.precoMedio * Number(e.quantidade),
      0,
    );
    const alertasEstoque = estoque.filter(
      (e) => Number(e.quantidade) <= Number(e.estoqueMinimo),
    );
    const alertasValidade = estoque.filter((e) => {
      if (!e.validade) return false;
      const dias = Math.ceil(
        (new Date(e.validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return dias <= 7 && dias >= 0;
    });

    return NextResponse.json({
      estoque,
      resumo: {
        totalItens,
        valorTotal,
        alertasEstoque: alertasEstoque.length,
        alertasValidade: alertasValidade.length,
      },
    });
  } catch (error) {
    console.error("Erro ao listar estoque:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const body = await request.json();
    const {
      nome,
      categoria,
      quantidade,
      unidade,
      precoMedio,
      precoUltimo,
      validade,
      estoqueMinimo,
    } = body;

    if (!nome)
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );

    const item = await prisma.estoque.create({
      data: {
        usuarioId: user.id,
        nome,
        categoria: categoria || null,
        quantidade: quantidade || 0,
        unidade: unidade || "un",
        precoMedio: precoMedio ? Math.round(precoMedio * 100) : 0,
        precoUltimo: precoUltimo ? Math.round(precoUltimo * 100) : 0,
        validade: validade ? new Date(validade) : null,
        estoqueMinimo: estoqueMinimo || 1,
      },
    });

    return NextResponse.json({ message: "Item criado", item }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar item estoque:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
