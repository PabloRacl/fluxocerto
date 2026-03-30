import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso } from "@/biblioteca/resposta-api";
import { painelService } from "@/servicos/PainelService";

export const dynamic = "force-dynamic";

/**
 * POST /api/painel/sincronizar
 * Dispara o motor de reconstrução de saldos da Fase 27.
 */
export async function POST() {
  try {
    const user = await obterUsuarioAutenticado();
    const resultado = await painelService.sincronizarSaldos(user.id);
    return sucesso(resultado);
  } catch (error) {
    return tratarErro(error);
  }
}
