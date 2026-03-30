import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { painelService } from "@/servicos/PainelService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await obterUsuarioAutenticado();
    const resumo = await painelService.obterResumoRapido(user.id);
    return NextResponse.json({ ok: true, data: resumo, meta: { generatedAt: new Date().toISOString() } });
  } catch (error) {
    return tratarErro(error);
  }
}
