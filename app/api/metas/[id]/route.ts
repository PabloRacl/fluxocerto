export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { metaService } from "@/servicos/MetaService";
import { prisma } from "@/biblioteca/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();

    // Caso 1: Depósito Rápido (Gamificado + Auditado)
    if (body.deposito !== undefined) {
      const result = await metaService.depositar((await params).id, user.id, body.deposito);
      return NextResponse.json({
        message: result.atingiu ? "🎉 Meta atingida! Parabéns!" : "Depósito registrado",
        meta: result.meta,
        atingiu: result.atingiu,
      });
    }

    // Caso 2: Edição Normal
    const updated = await (prisma as any).meta.update({
      where: { id: (await params).id, usuarioId: user.id },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        valorAlvo: body.valorAlvo,
        montanteAtual: body.montanteAtual,
        prazo: body.prazo ? new Date(body.prazo) : undefined,
        icone: body.icone,
        cor: body.cor,
      },
    });

    return NextResponse.json({ message: "Meta atualizada", meta: updated });
  } catch (error: any) {
    console.error("Erro PUT Meta:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await obterUsuarioAutenticado();
    
    await (prisma as any).meta.update({
      where: { id: (await params).id, usuarioId: user.id },
      data: { isArchived: true, archivedAt: new Date() },
    });

    return NextResponse.json({ message: "Meta enviada para lixeira" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao remover meta" }, { status: 500 });
  }
}
