export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { painelService } from "@/servicos/PainelService";

// ============================================
// GET - Gamificação e Medalhas
// ============================================
export async function GET() {
  try {
    const user = await obterUsuarioAutenticado();
    const gamificacao = await painelService.obterGamificacao(user.id);

    return NextResponse.json({ ok: true, data: gamificacao });
  } catch (error) {
    return tratarErro(error);
  }
}
