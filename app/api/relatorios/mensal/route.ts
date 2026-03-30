import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso } from "@/biblioteca/resposta-api";
import { relatorioService } from "@/servicos/RelatorioService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    // Mapeando queries pro formato aceito no fallback
    const mensalData = await relatorioService.obterMensal(user.id, {
      mesParam: params.mes,
      anoParam: params.ano,
      tipoParam: params.tipo,
      contaIdParam: params.contaId,
      categoriaIdParam: params.categoriaId,
      dataInicioParam: params.dataInicio,
      dataFimParam: params.dataFim,
      periodoParam: params.periodo,
    });

    return sucesso(mensalData);
  } catch (error) {
    return tratarErro(error);
  }
}
