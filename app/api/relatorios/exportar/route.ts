export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { relatorioService } from "@/servicos/RelatorioService";

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    const { conteudoCSV, nomePeriodo } = await relatorioService.exportarCSVTransacoes(user.id, {
      mesParam: params.mes,
      anoParam: params.ano,
      tipoParam: params.tipo,
      contaIdParam: params.contaId,
      categoriaIdParam: params.categoriaId,
      dataInicioParam: params.dataInicio,
      dataFimParam: params.dataFim,
      periodoParam: params.periodo,
    });

    const tipoArquivo = params.tipo === "ALL" || !params.tipo ? "completo" : params.tipo === "INCOME" ? "receitas" : "despesas";
    const nomeArquivo = `fluxocerto-${tipoArquivo}-${nomePeriodo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.csv`;

    return new NextResponse(conteudoCSV, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    return NextResponse.json({ error: "Erro interno ao exportar CSV" }, { status: 500 });
  }
}
