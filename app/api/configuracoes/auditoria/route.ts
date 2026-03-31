import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { auditService } from "@/servicos/AuditService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const logs = await auditService.listar(user.id, 50);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Erro ao buscar logs de auditoria:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar logs" },
      { status: 500 }
    );
  }
}
