export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { relatorioService } from "@/servicos/RelatorioService";
import { pdf } from "@react-pdf/renderer";
import { RelatorioPDF } from "@/componentes/pdf/RelatorioPDF";

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    // Abstração centralizada resolve transacoes, periodos e fallback rules
    const relatorioPdf = await relatorioService.obterTransacoesParaExportacao(user.id, {
      mesParam: params.mes,
      anoParam: params.ano,
      tipoParam: params.tipo,
      contaIdParam: params.contaId,
      categoriaIdParam: params.categoriaId,
      dataInicioParam: params.dataInicio,
      dataFimParam: params.dataFim,
      periodoParam: params.periodo,
    });

    const pdfBuffer = await pdf(
      RelatorioPDF({
        dados: relatorioPdf.transacoes,
        periodo: relatorioPdf.nomePeriodo,
        saude: relatorioPdf.saude,
        patrimonio: relatorioPdf.patrimonio,
        filtros: {
          tipo: params.tipo !== "ALL" ? params.tipo : undefined,
          conta: params.contaId || undefined,
          categoria: params.categoriaId || undefined,
        },
      }),
    ).toBuffer();

    const nomeArquivo = `relatorio-fluxocerto-${relatorioPdf.nomePeriodo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar PDF" },
      { status: 500 }
    );
  }
}
