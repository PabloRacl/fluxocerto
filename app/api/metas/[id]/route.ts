import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// PUT - Atualizar Meta (depósito ou edição)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const meta = await prisma.meta.findUnique({
      where: { id: params.id },
      include: { usuario: { select: { email: true } } },
    });

    if (!meta || meta.usuario.email !== session.user.email) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
    }

    const body = await request.json();

    // Se só contém "deposito", é um depósito rápido
    if (body.deposito !== undefined) {
      const novoMontante = meta.montanteAtual + body.deposito;
      const atingiu = novoMontante >= meta.valorAlvo;

      const updated = await prisma.meta.update({
        where: { id: params.id },
        data: {
          montanteAtual: Math.min(novoMontante, meta.valorAlvo),
          concluida: atingiu,
          concluidaEm: atingiu ? new Date() : null,
        },
      });

      return NextResponse.json({
        message: atingiu ? "🎉 Meta atingida! Parabéns!" : "Depósito registrado",
        meta: updated,
        atingiu,
      });
    }

    // Edição normal
    const updated = await prisma.meta.update({
      where: { id: params.id },
      data: {
        nome: body.nome ?? meta.nome,
        descricao: body.descricao !== undefined ? body.descricao : meta.descricao,
        valorAlvo: body.valorAlvo ?? meta.valorAlvo,
        montanteAtual: body.montanteAtual ?? meta.montanteAtual,
        prazo: body.prazo ? new Date(body.prazo) : meta.prazo,
        icone: body.icone ?? meta.icone,
        cor: body.cor ?? meta.cor,
      },
    });

    return NextResponse.json({ message: "Meta atualizada", meta: updated });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Soft Delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const meta = await prisma.meta.findUnique({
      where: { id: params.id },
      include: { usuario: { select: { email: true } } },
    });

    if (!meta || meta.usuario.email !== session.user.email) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
    }

    await prisma.meta.update({
      where: { id: params.id },
      data: { excluida: true, excluidaEm: new Date() },
    });

    return NextResponse.json({ message: "Meta enviada para lixeira" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
