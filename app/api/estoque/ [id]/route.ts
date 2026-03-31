export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { estoqueService } from "@/servicos/EstoqueService";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    
    const item = await estoqueService.atualizar((await params).id, user.id, body);
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await obterUsuarioAutenticado();
    await estoqueService.desativar((await params).id, user.id);
    return NextResponse.json({ message: "Item removido" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao remover item" }, { status: 500 });
  }
}
