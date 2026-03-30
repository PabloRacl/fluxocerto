export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { relatorioService } from "@/servicos/RelatorioService";

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const searchParams = request.nextUrl.searchParams;
    const mes = searchParams.get("month");
    const ano = searchParams.get("year");
    const tipo = searchParams.get("type");

    if (!mes || !ano) {
      return NextResponse.json({ error: "Mês e ano são obrigatórios" }, { status: 400 });
    }

    const csvContent = await relatorioService.exportarCSVCategorias(user.id, { mes, ano, tipo });
    const nomeArquivo = `categorias_${mes}_${ano}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar categorias:", error);
    return NextResponse.json({ error: "Erro interno ao gerar exportação" }, { status: 500 });
  }
}
