export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso } from "@/biblioteca/resposta-api";
import { relatorioService } from "@/servicos/RelatorioService";

export async function GET() {
  try {
    const user = await obterUsuarioAutenticado();
    const history = await relatorioService.obterHistorico(user.id);

    return sucesso(history);
  } catch (error) {
    return tratarErro(error);
  }
}
