export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// GET - Detalhe da Assinatura
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
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const assinatura = await prisma.assinatura.findFirst({
      where: { id: params.id, usuarioId: user.id },
      include: {
        categoria: { select: { id: true, name: true, color: true } },
        conta: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    if (!assinatura) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ assinatura });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT - Atualizar Assinatura
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
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const assinatura = await prisma.assinatura.findFirst({
      where: { id: params.id, usuarioId: user.id },
    });

    if (!assinatura) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const updated = await prisma.assinatura.update({
      where: { id: params.id },
      data: {
        nome: body.nome ?? assinatura.nome,
        descricao:
          body.descricao !== undefined ? body.descricao : assinatura.descricao,
        valor:
          body.valor !== undefined
            ? Math.round(body.valor * 100)
            : assinatura.valor,
        ciclo: body.ciclo ?? assinatura.ciclo,
        proximaRenovacao: body.proximaRenovacao
          ? new Date(body.proximaRenovacao)
          : assinatura.proximaRenovacao,
        categoriaId:
          body.categoriaId !== undefined
            ? body.categoriaId
            : assinatura.categoriaId,
        contaId: body.contaId !== undefined ? body.contaId : assinatura.contaId,
        ativa: body.ativa ?? assinatura.ativa,
        canceladaEm: body.canceladaEm
          ? new Date(body.canceladaEm)
          : assinatura.canceladaEm,
      },
      include: {
        categoria: { select: { id: true, name: true, color: true } },
        conta: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json({
      message: "Assinatura atualizada",
      assinatura: updated,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Soft Delete
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
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const assinatura = await prisma.assinatura.findFirst({
      where: { id: params.id, usuarioId: user.id },
    });

    if (!assinatura) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 },
      );
    }

    await prisma.assinatura.update({
      where: { id: params.id },
      data: { isArchived: true, archivedAt: new Date() },
    });

    return NextResponse.json({ message: "Assinatura enviada para lixeira" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
