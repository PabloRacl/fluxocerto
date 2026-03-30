import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { estoqueService } from "@/servicos/EstoqueService";

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const { searchParams } = new URL(request.url);
    const mostrarInativos = searchParams.get("inativos") === "true";
    
    const data = await estoqueService.listar(user.id, mostrarInativos);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao listar estoque" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    
    const item = await estoqueService.criar(user.id, body);
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar item" }, { status: 500 });
  }
}
